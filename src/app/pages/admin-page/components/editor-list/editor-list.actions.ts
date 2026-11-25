import { Injectable, inject } from '@angular/core';
import {
	EMPTY,
	Observable,
	catchError,
	concat,
	concatMap,
	filter,
	finalize,
	from,
	map,
	of,
	reduce,
	switchMap,
	tap,
	toArray
} from 'rxjs';
import {
	BulkItemRef,
	DraftSaveRequest,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { BulkItemResult } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	BulkActionOf,
	SummaryOf
} from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { pickFields } from '../../drafts/draft-fields';
import { EditorWriteService } from '../../services/editor-write.service';
import { describeWriteError } from '../../utilities/write-errors';
import { BulkActionHost } from './bulk-action-host';
import { BulkActionRunnerService } from './bulk-action-runner.service';
import {
	BulkSummary,
	DRAFT_NOUN,
	countItems,
	summarizeBulkResults
} from './bulk-results';
import {
	UndoStep,
	UndoableAction,
	UndoableItem,
	toUndoSteps,
	wouldChange
} from './bulk-undo';
import { EditorListStore } from './editor-list.store';
import { OrderedItem, toOrderUpdates } from './list-order';
import { ItemRow, ListRow } from './list-rows';

type Item = SummaryOf<EditorContentType>;

/**
 * Every write from a tool's list: a row's actions and bulk actions on the
 * selection (also the type's own, as the `BULK_ACTION_HOST`). Updates send
 * only the items they'd change, and offer Undo. Each reloads the list when
 * done. Provided by the list page.
 */
@Injectable()
export class EditorListActions implements BulkActionHost {
	private store = inject(EditorListStore);
	private editorContent = inject(EditorContentService);
	private drafts = inject(DraftsService);
	private bulkRunner = inject(BulkActionRunnerService);
	private writer = inject(EditorWriteService);
	private notifier = inject(AdminNotifierService);

	public readonly type = this.store.type;

	/** Saves a copy of the item as a new draft, then opens it. */
	public duplicate(item: { id: string }): void {
		const type = this.type();
		const draftId = crypto.randomUUID();
		this.writer
			.run({
				request: () =>
					this.editorContent.fetchItem(type, item.id).pipe(
						switchMap((published) =>
							this.drafts.saveDraft(draftId, {
								type,
								fields: pickFields(type, published)
							} as DraftSaveRequest)
						)
					),
				describeFailure: (error) =>
					`Couldn't duplicate it. ${describeWriteError(error)}`
			})
			.pipe(filter(Boolean))
			.subscribe(() => {
				this.store.reload();
				this.store.openDraft(draftId);
			});
	}

	/**
	 * Moves an item (by drag or its menu) and saves the new order: one update
	 * per item whose position changed.
	 */
	public moveItem(fromIndex: number, toIndex: number): void {
		if (fromIndex === toIndex) {
			return;
		}
		this.store.moveItem(fromIndex, toIndex);
		const type = this.type();
		const updates = toOrderUpdates(
			this.store.itemRows().map(({ item }) => item as OrderedItem)
		);
		this.store.isBusy.set(true);
		from(updates)
			.pipe(
				concatMap(({ id, startingRevision, sortOrder }) =>
					this.editorContent
						.updateItem(type, id, { sortOrder, startingRevision })
						.pipe(
							map(() => true),
							catchError(() => of(false))
						)
				),
				toArray(),
				finalize(() => {
					this.store.isBusy.set(false);
					this.store.reload();
				})
			)
			.subscribe((results) => {
				const failures = results.filter((isSaved) => !isSaved).length;
				if (failures > 0) {
					this.notifier.notifyFailure(
						`Couldn't save the new position of ${countItems(failures, this.store.config().noun)}. Try again.`
					);
				}
			});
	}

	public toggleVisibility(row: ItemRow): void {
		this.applyUpdate({ action: row.item.visible ? 'hide' : 'show' }, [
			row.item
		]);
	}

	public delete(row: ListRow): void {
		if (row.kind === 'item') {
			this.deleteItem(row.name, row.ref).subscribe();
			return;
		}
		this.writer
			.run({
				confirm: {
					title: `Delete your unpublished ${row.name}?`,
					message: "This can't be undone.",
					confirmLabel: 'Delete'
				},
				request: () =>
					this.bulkRunner
						.deleteDrafts([row.id])
						.pipe(tap((summary) => this.notifier.notify(summary)))
			})
			.subscribe(() => this.store.reload());
	}

	/** Deletes a published item (after confirming); emits whether it did. */
	public deleteItem(name: string, ref: BulkItemRef): Observable<boolean> {
		return this.writer
			.run({
				confirm: {
					title: `Delete ${name}?`,
					message: "It's removed from the site. This can't be undone.",
					confirmLabel: 'Delete'
				},
				request: () => this.editorContent.deleteItem(this.type(), ref),
				success: `Deleted ${name}.`
			})
			.pipe(tap(() => this.store.reload()));
	}

	/**
	 * Runs a bulk action on the selection: a delete (after confirming) of the
	 * selected items and drafts, or an update of the selected items.
	 */
	public runBulkAction(action: BulkActionOf<EditorContentType>): void {
		const selected = this.selectedItems();
		if (action.action === 'delete') {
			this.deleteSelection();
			return;
		}
		this.store.isBusy.set(true);
		selected
			.pipe(finalize(() => this.store.isBusy.set(false)))
			.subscribe({
				next: (items) =>
					this.applyUpdate(action as UndoableAction, items),
				error: (error: unknown) =>
					this.notifier.notifyFailure(describeWriteError(error))
			});
	}

	/**
	 * Updates the items it would change, then says how it went, with Undo
	 * when it all went through.
	 */
	private applyUpdate(
		action: UndoableAction,
		items: readonly UndoableItem[]
	): void {
		const changing = items.filter((item) => wouldChange(action, item));
		if (changing.length === 0) {
			this.notifier.notifySuccess('Nothing to change.');
			return;
		}
		const before = new Map(changing.map((item) => [item.id, item]));
		const noun = this.store.config().noun;
		this.store.isBusy.set(true);
		this.bulkRunner
			.run(
				this.type(),
				action as BulkActionOf<EditorContentType>,
				changing.map(toRef)
			)
			.pipe(
				finalize(() => {
					this.store.isBusy.set(false);
					this.store.reload();
				})
			)
			.subscribe((results) => {
				const summary = summarizeBulkResults(
					action.action,
					results,
					noun
				);
				const steps = toUndoSteps(
					action,
					before,
					results as BulkItemResult<UndoableItem>[]
				);
				if (summary.hasFailures || steps.length === 0) {
					this.notifier.notify(summary);
					return;
				}
				this.notifier.notifyWithUndo(summary.message, () =>
					this.undo(steps)
				);
			});
	}

	private undo(steps: readonly UndoStep[]): void {
		const noun = this.store.config().noun;
		this.store.isBusy.set(true);
		from(steps)
			.pipe(
				concatMap(({ items, ...action }) =>
					this.bulkRunner.run(
						this.type(),
						action as BulkActionOf<EditorContentType>,
						items
					)
				),
				reduce<BulkItemResult<unknown>[], BulkItemResult<unknown>[]>(
					(all, results) => [...all, ...results],
					[]
				),
				finalize(() => {
					this.store.isBusy.set(false);
					this.store.reload();
				})
			)
			.subscribe((results) => {
				const summary = summarizeBulkResults('undo', results, noun);
				this.notifier.notify(summary);
			});
	}

	/** Deletes the selected items and drafts, after confirming. */
	private deleteSelection(): void {
		const draftIds = this.store.selection.selectedDraftIds();
		const itemCount = this.store.selectedItemCount();
		const noun = this.store.config().noun;
		const what = [
			countItems(itemCount, noun),
			countItems(draftIds.length, DRAFT_NOUN)
		]
			.filter((part) => !part.startsWith('0 '))
			.join(' and ');
		this.writer
			.confirm({
				title: `Delete ${what}?`,
				message: "This can't be undone.",
				confirmLabel: `Delete ${what}`
			})
			.pipe(
				filter(Boolean),
				switchMap(() => {
					this.store.isBusy.set(true);
					const items: Observable<BulkSummary> =
						itemCount > 0
							? this.selectedItems().pipe(
									switchMap((selected) =>
										this.bulkRunner.run(
											this.type(),
											{ action: 'delete' },
											selected.map(toRef)
										)
									),
									map((results) =>
										summarizeBulkResults('delete', results, noun)
									)
								)
							: EMPTY;
					return concat(
						items,
						draftIds.length > 0
							? this.bulkRunner.deleteDrafts(draftIds)
							: EMPTY
					).pipe(
						finalize(() => {
							this.store.isBusy.set(false);
							this.store.reload();
						})
					);
				})
			)
			.subscribe({
				next: (summary) => this.notifier.notify(summary),
				// Only fetching every match can fail here; bulk failures are summaries.
				error: (error: unknown) =>
					this.notifier.notifyFailure(describeWriteError(error))
			});
	}

	/** The selected items: those on the page, or every match. */
	private selectedItems(): Observable<Item[]> {
		const { query } = this.store.request();
		if (this.store.selection.isAllMatching() && query) {
			return this.bulkRunner.fetchAllMatching(this.type(), query);
		}
		const ids = new Set(
			this.store.selection.selectedRefs().map(({ id }) => id)
		);
		return of(
			this.store
				.itemRows()
				.filter(({ id }) => ids.has(id))
				.map(({ item }) => item)
		);
	}
}

function toRef({ id, revision }: { id: string; revision: number }): BulkItemRef {
	return { id, startingRevision: revision };
}
