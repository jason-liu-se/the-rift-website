import { Injectable, inject } from '@angular/core';
import {
	EMPTY,
	Observable,
	concat,
	filter,
	finalize,
	of,
	switchMap,
	tap
} from 'rxjs';
import {
	BulkItemRef,
	DraftSaveRequest,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	BulkActionOf,
	SummaryOf,
	UpdateRequestOf
} from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { pickFields } from '../../drafts/draft-fields';
import { EditorWriteService } from '../../services/editor-write.service';
import { describeWriteError } from '../../utilities/write-errors';
import { BulkActionHost } from './bulk-action-host';
import { BulkActionRunnerService } from './bulk-action-runner.service';
import { BulkSummary, DRAFT_NOUN, countItems } from './bulk-results';
import { EditorListStore } from './editor-list.store';
import { ItemRow, ListRow } from './list-rows';

type Item = SummaryOf<EditorContentType>;

/**
 * Every write from a tool's list: a row's actions and bulk actions on the
 * selection (also the type's own, as the `BULK_ACTION_HOST`). Each reloads
 * the list when done. Provided by the list page.
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
	public duplicate(item: Item): void {
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

	public toggleVisibility(row: ItemRow): void {
		const { item } = row;
		const request = {
			visible: !item.visible,
			startingRevision: item.revision
		} as UpdateRequestOf<EditorContentType>;
		this.writer
			.run({
				request: () =>
					this.editorContent.updateItem(
						this.type(),
						item.id,
						request
					),
				success: `${item.visible ? 'Hid' : 'Showed'} ${row.name}.`
			})
			.subscribe(() => this.store.reload());
	}

	public delete(row: ListRow): void {
		const isDraft = row.kind === 'draft';
		const what = isDraft ? `your draft ${row.name}` : row.name;
		this.writer
			.run({
				confirm: {
					title: `Delete ${what}?`,
					message: "This can't be undone.",
					confirmLabel: 'Delete'
				},
				request: () =>
					isDraft
						? this.deleteDrafts([row.id])
						: this.editorContent.deleteItem(this.type(), row.ref),
				success: isDraft ? undefined : `Deleted ${row.name}.`
			})
			.subscribe(() => this.store.reload());
	}

	/**
	 * Runs a bulk action on the selected items, and a delete on the selected
	 * drafts too (after confirming), one summary per request.
	 */
	public runBulkAction(action: BulkActionOf<EditorContentType>): void {
		const isDelete = action.action === 'delete';
		const draftIds = isDelete
			? this.store.selection.selectedDraftIds()
			: [];
		const itemCount = this.store.selectedItemCount();
		const what = [
			countItems(itemCount, this.store.config().noun),
			countItems(draftIds.length, DRAFT_NOUN)
		]
			.filter((part) => !part.startsWith('0 '))
			.join(' and ');
		const confirmed = isDelete
			? this.writer.confirm({
					title: `Delete ${what}?`,
					message: "This can't be undone.",
					confirmLabel: `Delete ${what}`
				})
			: of(true);
		confirmed
			.pipe(
				filter(Boolean),
				switchMap(() => {
					this.store.isBusy.set(true);
					return concat(
						itemCount > 0 ? this.runOnItems(action) : EMPTY,
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

	private deleteDrafts(ids: string[]): Observable<BulkSummary> {
		return this.bulkRunner
			.deleteDrafts(ids)
			.pipe(tap((summary) => this.notifier.notify(summary)));
	}

	private runOnItems(
		action: BulkActionOf<EditorContentType>
	): Observable<BulkSummary> {
		const { query } = this.store.request();
		const refs: Observable<BulkItemRef[]> =
			this.store.selection.isAllMatching() && query
				? this.bulkRunner.fetchAllMatching(this.type(), query)
				: of(this.store.selection.selectedRefs());
		return refs.pipe(
			switchMap((refs) =>
				this.bulkRunner.run(
					this.type(),
					action,
					refs,
					this.store.config().noun
				)
			)
		);
	}
}
