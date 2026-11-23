import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	TemplateRef,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
	untracked
} from '@angular/core';
import {
	takeUntilDestroyed,
	toObservable,
	toSignal
} from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
	EMPTY,
	Observable,
	Subject,
	catchError,
	combineLatest,
	concat,
	debounceTime,
	filter,
	finalize,
	map,
	merge,
	of,
	switchMap
} from 'rxjs';
import {
	EDITOR_PAGE_SIZE,
	EDITOR_SEARCH_DEBOUNCE_MS
} from 'src/app/config/admin';
import {
	BulkItemRef,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import {
	DraftSummary,
	EditorCollection,
	PaginatedResponse
} from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import { LocalDraftsService } from 'src/app/services/drafts/local-drafts.service';
import {
	BulkActionOf,
	ListQueryOf,
	SummaryOf,
	UpdateRequestOf
} from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { FallbackPanelComponent } from 'src/app/components/fallback-panel/fallback-panel.component';
import { LoadState } from 'src/app/utilities/load-state';
import { describeWriteError } from '../../utilities/write-errors';
import { confirmAction } from '../confirm-dialog/confirm-dialog.component';
import { EditorAvatarComponent } from '../editor-avatar/editor-avatar.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import {
	BulkActionBarComponent,
	CommonBulkAction
} from './bulk-action-bar/bulk-action-bar.component';
import { BulkActionRunnerService } from './bulk-action-runner.service';
import { ItemNoun, countItems } from './bulk-results';
import { ListSelection, PageRows } from './list-selection';
import { fromListParams, toListParams } from './list-params';
import { itemName } from './item-name';
import {
	FilterOption,
	ListFilters,
	ListFiltersComponent
} from './list-filters/list-filters.component';

const DRAFTS: ItemNoun = { one: 'draft', many: 'drafts' };

const STATUS_FILTERS: Record<'news' | 'other', FilterOption[]> = {
	news: [
		{ value: 'live', label: 'Live' },
		{ value: 'scheduled', label: 'Scheduled' },
		{ value: 'hidden', label: 'Hidden' }
	],
	other: [
		{ value: 'live', label: 'Live' },
		{ value: 'hidden', label: 'Hidden' }
	]
};

/** An item's row; each content type's own cell is `itemTemplate`. */
export interface ItemTemplateContext<T extends EditorContentType> {
	$implicit: SummaryOf<T>;
}

/**
 * One admin tool's list: every item of its type, public or not, with the
 * editor's own new drafts first. Filters, search, pages, selection (Ctrl+A
 * previews selecting the page; Enter or Space confirms, Escape cancels), bulk
 * actions, and each row's actions. Project a type's own bulk actions with the
 * `bulkActions` attribute; they call `runBulkAction`.
 */
@Component({
	selector: 'app-editor-list',
	templateUrl: './editor-list.component.html',
	styleUrl: './editor-list.component.scss',
	imports: [
		BulkActionBarComponent,
		EditorAvatarComponent,
		FallbackPanelComponent,
		ListFiltersComponent,
		MatCheckbox,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatPaginator,
		NgTemplateOutlet,
		StatusBadgeComponent
	],
	host: { '(keydown)': 'handleSelectionKeys($event)' }
})
export class EditorListComponent<T extends EditorContentType> {
	private editorContent = inject(EditorContentService);
	private draftsService = inject(DraftsService);
	private localDrafts = inject(LocalDraftsService);
	private auth = inject(AuthService);
	private bulkRunner = inject(BulkActionRunnerService);
	private notifier = inject(AdminNotifierService);
	private dialog = inject(MatDialog);
	private announcer = inject(LiveAnnouncer);
	private router = inject(Router);
	private route = inject(ActivatedRoute);

	public readonly type = input.required<T>();
	public readonly noun = input.required<ItemNoun>();
	public readonly searchFields = input.required<readonly FilterOption[]>();
	/** Each item's main cell; its name by default. */
	public readonly itemTemplate = input<TemplateRef<ItemTemplateContext<T>>>();

	public readonly editItem = output<SummaryOf<T>>();
	public readonly duplicateItem = output<SummaryOf<T>>();
	public readonly openDraft = output<DraftSummary>();

	/** The type's collections, for the filter and the type's own actions. */
	public readonly collections = signal<EditorCollection[] | undefined>(
		undefined
	);

	protected readonly pageSize = EDITOR_PAGE_SIZE;
	private readonly fromUrl = fromListParams(
		this.route.snapshot.queryParamMap
	);
	protected readonly filters = signal<ListFilters>(this.fromUrl.filters);
	protected readonly pageIndex = signal(this.fromUrl.pageIndex);
	protected readonly page = signal<
		PaginatedResponse<SummaryOf<T>> | undefined
	>(undefined);
	protected readonly drafts = signal<DraftSummary[]>([]);
	protected readonly selection = new ListSelection();
	protected readonly isBusy = signal(false);
	protected readonly loadState = new LoadState(() => this.reloadItems());
	protected readonly itemName = itemName;
	/** The editor, who made every draft listed. */
	protected readonly currentUser = computed(
		() => this.auth.user() ?? undefined
	);

	protected readonly statuses = computed(
		() => STATUS_FILTERS[this.type() === 'news' ? 'news' : 'other']
	);
	protected readonly items = computed(() => this.page()?.items ?? []);
	protected readonly total = computed(() => this.page()?.total ?? 0);
	protected readonly pageRefs = computed(() => this.items().map(toRef));
	/** The editor's drafts of new items; drafts of edits mark their item. */
	protected readonly newDrafts = computed(() =>
		['', 'draft'].includes(this.filters().status)
			? this.drafts().filter(({ target }) => !target)
			: []
	);
	protected readonly idsWithDrafts = computed(
		() =>
			new Set(
				this.drafts().flatMap(({ target }) =>
					target ? [target.id] : []
				)
			)
	);
	/** Every row this page shows: the new drafts, then the items. */
	protected readonly pageRows = computed<PageRows>(() => ({
		items: this.pageRefs(),
		draftIds: this.newDrafts().map(({ id }) => id)
	}));
	/** "13 posts": the rows on this page, for Ctrl+A's preview. */
	protected readonly pageRowCount = computed(() => {
		const { items, draftIds } = this.pageRows();
		const drafts = draftIds.length
			? ` and ${countItems(draftIds.length, DRAFTS)}`
			: '';
		return `${countItems(items.length, this.noun())}${drafts}`;
	});
	protected readonly hasRows = computed(() => {
		const { items, draftIds } = this.pageRows();
		return items.length + draftIds.length > 0;
	});
	/** Every item matching the filters, and the drafts listed with them. */
	protected readonly selectableCount = computed(
		() => this.total() + this.newDrafts().length
	);
	protected readonly selectedCount = computed(() =>
		this.selection.count(this.total())
	);

	private readonly search = toSignal(
		toObservable(computed(() => this.filters().search)).pipe(
			debounceTime(EDITOR_SEARCH_DEBOUNCE_MS)
		),
		{ initialValue: this.fromUrl.filters.search }
	);
	/** Equal queries are one: typing waits for the debounced search. */
	private readonly query = computed(
		() => this.toQuery(this.filters(), this.search()),
		{ equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
	);
	private readonly reloads = new Subject<void>();
	private readonly collectionReloads = new Subject<void>();

	constructor() {
		// The filters and page go into the URL as they change.
		effect(() => {
			const params = toListParams(this.filters(), this.pageIndex());
			untracked(() => this.saveToUrl(params));
		});
		const requests = combineLatest([
			toObservable(this.query),
			toObservable(this.pageIndex)
		]);
		merge(requests, this.reloads)
			.pipe(
				map(() => ({
					query: this.query(),
					pageIndex: this.pageIndex()
				})),
				switchMap(({ query, pageIndex }) =>
					this.fetchPage(query, pageIndex)
				),
				takeUntilDestroyed()
			)
			.subscribe();
		merge(toObservable(this.type), this.collectionReloads)
			.pipe(
				switchMap(() => {
					const type = this.type();
					return type === 'gallery' || type === 'downloads'
						? this.editorContent
								.fetchCollections(type)
								.pipe(catchError(() => of(undefined)))
						: of(undefined);
				}),
				takeUntilDestroyed()
			)
			.subscribe((collections) => this.collections.set(collections));
	}

	/** Fetches the collections again, after one was created or changed. */
	public reloadCollections(): void {
		this.collectionReloads.next();
		this.reloadItems();
	}

	/** Fetches the list (and the editor's drafts) again, e.g. after a save. */
	public reloadItems(): void {
		this.reloads.next();
	}

	/** Runs a bulk action on the selection (deletes need confirming). */
	public runBulkAction(action: BulkActionOf<T>): void {
		const draftCount = this.selection.selectedDraftIds().length;
		const what = [
			countItems(this.selectedCount() - draftCount, this.noun()),
			countItems(draftCount, DRAFTS)
		]
			.filter((part) => !part.startsWith('0 '))
			.join(' and ');
		const confirmed$ =
			action.action === 'delete'
				? confirmAction(this.dialog, {
						title: `Delete ${what}?`,
						message: "This can't be undone.",
						confirmLabel: `Delete ${what}`
					})
				: of(true);
		confirmed$
			.pipe(filter(Boolean))
			.subscribe(() => this.runConfirmedBulkAction(action));
	}

	protected setFilters(filters: ListFilters): void {
		this.filters.set(filters);
		this.pageIndex.set(0);
	}

	protected changePage({ pageIndex }: PageEvent): void {
		this.pageIndex.set(pageIndex);
	}

	protected runCommonAction(action: CommonBulkAction): void {
		this.runBulkAction({ action } as BulkActionOf<T>);
	}

	protected togglePage(isChecked: boolean): void {
		if (isChecked) {
			this.selection.selectPage(this.pageRows());
		} else {
			this.selection.unselectPage(this.pageRows());
		}
	}

	protected toggleRow(item: SummaryOf<T>): void {
		this.selection.toggle(toRef(item), this.pageRows());
	}

	protected selectAllMatching(): void {
		this.selection.selectAllMatching();
	}

	protected toggleVisibility(item: SummaryOf<T>): void {
		const request = {
			visible: !item.visible,
			startingRevision: item.revision
		} as UpdateRequestOf<T>;
		this.write(
			this.editorContent.updateItem(this.type(), item.id, request),
			`${item.visible ? 'Hid' : 'Showed'} ${this.itemName(item)}.`
		);
	}

	protected deleteItem(item: SummaryOf<T>): void {
		const name = this.itemName(item);
		confirmAction(this.dialog, {
			title: `Delete ${name}?`,
			message: "This can't be undone.",
			confirmLabel: 'Delete'
		})
			.pipe(filter(Boolean))
			.subscribe(() =>
				this.write(
					this.editorContent.deleteItem(this.type(), toRef(item)),
					`Deleted ${name}.`
				)
			);
	}

	protected deleteDraft(draft: DraftSummary): void {
		const name = this.itemName(draft.fields);
		confirmAction(this.dialog, {
			title: `Delete your draft ${name}?`,
			message: "This can't be undone.",
			confirmLabel: 'Delete draft'
		})
			.pipe(
				filter(Boolean),
				switchMap(() => this.bulkRunner.deleteDrafts([draft.id])),
				finalize(() => this.reloadItems())
			)
			.subscribe((summary) => this.notifier.notify(summary));
	}

	/**
	 * Opens a row's item or draft from a click anywhere on it but its own
	 * controls (checkbox, buttons, menu, links), which do their own thing.
	 */
	protected openFromRow(event: Event, open: () => void): void {
		const target = event.target as HTMLElement;
		if (!target.closest('a, button, input, label, mat-checkbox')) {
			open();
		}
	}

	/** Ctrl+A previews selecting the page; Enter/Space confirm, Escape cancels. */
	protected handleSelectionKeys(event: KeyboardEvent): void {
		const target = event.target as HTMLElement;
		const isTyping = !!target.closest?.(
			'input:not([type="checkbox"]), textarea, [role="combobox"], [role="listbox"]'
		);
		const rowCount = this.pageRowCount();
		if (this.selection.isPreviewingPage()) {
			const isConfirmed = event.key === 'Enter' || event.key === ' ';
			if (isConfirmed || event.key === 'Escape') {
				event.preventDefault();
				this.selection.endPreview(this.pageRows(), isConfirmed);
				this.announcer.announce(
					isConfirmed
						? `Selected ${rowCount}.`
						: 'Selection cancelled.'
				);
			}
			return;
		}
		if (isTyping) {
			return;
		}
		const isSelectAll =
			(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a';
		if (isSelectAll && this.hasRows()) {
			event.preventDefault();
			this.selection.previewPage();
			this.announcer.announce(
				`Select all ${rowCount} on this page? Press Enter or Space to select them, or Escape to cancel.`
			);
		} else if (event.key === 'Escape' && this.selectedCount() > 0) {
			this.selection.clear();
			this.announcer.announce('Selection cleared.');
		}
	}

	/**
	 * Runs the action on the selected items, then (deletes only: drafts have
	 * no other bulk action) on the selected drafts, one summary each.
	 */
	private runConfirmedBulkAction(action: BulkActionOf<T>): void {
		const draftIds = this.selection.selectedDraftIds();
		const hasItems = this.selectedCount() > draftIds.length;
		const onItems = hasItems
			? this.selectedRefs().pipe(
					switchMap((refs) =>
						this.bulkRunner.run(
							this.type(),
							action,
							refs,
							this.noun()
						)
					)
				)
			: EMPTY;
		const onDrafts =
			draftIds.length === 0
				? EMPTY
				: action.action === 'delete'
					? this.bulkRunner.deleteDrafts(draftIds)
					: of({
							message: `Skipped ${countItems(draftIds.length, DRAFTS)}: drafts can only be deleted. Publish them first.`,
							hasFailures: true
						});
		this.isBusy.set(true);
		concat(onItems, onDrafts)
			.pipe(
				finalize(() => {
					this.isBusy.set(false);
					this.selection.clear();
					this.reloadItems();
				})
			)
			.subscribe({
				next: (summary) => this.notifier.notify(summary),
				// Only fetching every match can fail here; bulk failures are summaries.
				error: (error: unknown) =>
					this.notifier.notifyFailure(describeWriteError(error))
			});
	}

	private selectedRefs(): Observable<BulkItemRef[]> {
		const query = this.query();
		return this.selection.isAllMatching() && query
			? this.bulkRunner.fetchAllMatching(this.type(), query)
			: of(this.selection.selectedRefs());
	}

	/** Merges `params` into the URL, unless it has them already. */
	private saveToUrl(params: Params): void {
		const current = this.route.snapshot.queryParamMap;
		const isSaved = Object.entries(params).every(
			([name, value]) => current.get(name) === value
		);
		if (!isSaved) {
			this.router.navigate([], {
				relativeTo: this.route,
				queryParams: params,
				queryParamsHandling: 'merge',
				preserveFragment: true,
				replaceUrl: true
			});
		}
	}

	/** Sends one write, says how it went, and reloads the list. */
	private write(request: Observable<unknown>, successMessage: string): void {
		request.subscribe({
			next: () => this.notifier.notifySuccess(successMessage),
			error: (error: unknown) => {
				this.notifier.notifyFailure(describeWriteError(error));
				this.reloadItems();
			},
			complete: () => this.reloadItems()
		});
	}

	private fetchPage(
		query: ListQueryOf<T> | undefined,
		pageIndex: number
	): Observable<unknown> {
		this.loadState.start();
		this.selection.clear();
		const drafts = this.draftsService.fetchDrafts(this.type()).pipe(
			catchError(() => of(this.drafts())),
			map((serverDrafts) => [...this.localOnlyDrafts(), ...serverDrafts])
		);
		const items = query
			? this.editorContent.fetchItems(this.type(), {
					...query,
					startIndex: pageIndex * EDITOR_PAGE_SIZE,
					limit: EDITOR_PAGE_SIZE
				})
			: of({ items: [], total: 0 });
		return combineLatest([items, drafts]).pipe(
			map(([page, drafts]) => {
				this.page.set(page);
				this.drafts.set(drafts);
				this.loadState.succeed();
			}),
			catchError(() => {
				this.loadState.fail();
				return EMPTY;
			})
		);
	}

	/** Drafts saved only in this browser (made offline), not yet on the server. */
	private localOnlyDrafts(): DraftSummary[] {
		const owner = this.auth.user()?.id;
		if (!owner) {
			return [];
		}
		return this.localDrafts
			.list(owner, this.type())
			.filter(({ revision }) => revision === undefined)
			.map(
				({ id, type, fields, target, updatedAt }) =>
					({
						id,
						type,
						fields,
						target,
						revision: 0,
						createdAt: updatedAt,
						updatedAt
					}) as DraftSummary
			);
	}

	/** The API query for the filters; undefined when only drafts are wanted. */
	private toQuery(
		{ scope, status, collection, searchFields }: ListFilters,
		search: string
	): ListQueryOf<T> | undefined {
		if (status === 'draft') {
			return undefined;
		}
		return {
			...(status && { status: status as ListQueryOf<T>['status'] }),
			...(collection && { collection }),
			...(scope === 'mine' && { createdBy: this.auth.user()?.id }),
			...(search.trim() && { q: search.trim() }),
			...(search.trim() &&
				searchFields.length > 0 && { in: searchFields.join(',') })
		} as ListQueryOf<T>;
	}
}

function toRef({
	id,
	revision
}: {
	id: string;
	revision: number;
}): BulkItemRef {
	return { id, startingRevision: revision };
}
