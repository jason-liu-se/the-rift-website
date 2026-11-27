import { moveItemInArray } from '@angular/cdk/drag-drop';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
	EMPTY,
	Observable,
	Subject,
	catchError,
	combineLatest,
	debounceTime,
	finalize,
	map,
	merge,
	of,
	switchMap,
	tap
} from 'rxjs';
import {
	EDITOR_PAGE_SIZE,
	EDITOR_SEARCH_DEBOUNCE_MS
} from 'src/app/core/config/admin';
import { EditorContentType } from 'src/app/core/api/api-requests';
import {
	DraftSummary,
	PaginatedResponse
} from 'src/app/core/api/api-responses';
import { AuthService } from 'src/app/core/auth/auth.service';
import { DraftsService } from 'src/app/features/admin/drafts/drafts.service';
import {
	ListQueryOf,
	SummaryOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/features/admin/editor-content/editor-content.service';
import { LoadState } from 'src/app/shared/utils/load-state';
import { DraftStore } from '../drafts/draft-store.service';
import { EDITOR_TYPES, toCollectionType } from '../editor-types';
import { CollectionsStore } from '../collections-store.service';
import { CellContext, ListColumn, toSortColumns } from './list-columns';
import {
	ListRow,
	filterDrafts,
	toDraftRow,
	toItemRow,
	toListQuery
} from './list-rows';
import {
	COLLECTION_FILTER,
	ListFilterSettings,
	ShownFilterField
} from './list-filter-fields';
import { fromListParams, toListParams } from './list-params';
import { ListSort, currentSort, toSortParams } from './list-sort';
import { ListSelection } from './list-selection';

type Item = SummaryOf<EditorContentType>;

/**
 * One tool's list state, provided by its page: the type and filters (from
 * the URL), the loaded page of items and the editor's drafts, and the
 * selection (cleared on every load). Writes are `EditorListActions`.
 */
@Injectable()
export class EditorListStore {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private editorContent = inject(EditorContentService);
	private draftsService = inject(DraftsService);
	private draftStore = inject(DraftStore);
	private auth = inject(AuthService);
	private collectionsStore = inject(CollectionsStore);

	private readonly queryParams = toSignal(this.route.queryParamMap, {
		requireSync: true
	});
	private readonly loaded = signal<
		| {
				type: EditorContentType;
				page: PaginatedResponse<Item>;
				drafts: DraftSummary[];
		  }
		| undefined
	>(undefined);
	private readonly reloads = new Subject<void>();

	public readonly type = toSignal(
		this.route.paramMap.pipe(
			map((params) => params.get('type') as EditorContentType)
		),
		{ requireSync: true }
	);
	public readonly selection = new ListSelection();
	public readonly loadState = new LoadState(() => this.reload());
	public readonly isLoading = signal(false);
	/** A bulk action is running. */
	public readonly isBusy = signal(false);

	public readonly config = computed(() => EDITOR_TYPES[this.type()]);
	private readonly params = computed(() =>
		fromListParams(this.queryParams(), this.config().filters)
	);
	public readonly filters = computed(() => this.params().filters);
	public readonly pageIndex = computed(() => this.params().pageIndex);
	/** The type's collections, once loaded (undefined without any). */
	private readonly collections = computed(() => {
		const type = toCollectionType(this.type());
		return type ? this.collectionsStore.collections(type)() : undefined;
	});
	/** The filters beside search, with their choices (collections once loaded). */
	public readonly filterFields = computed<ShownFilterField[]>(() =>
		this.config().filters.flatMap(({ key, label, anyLabel, options }) => {
			if (options !== 'collections') {
				return [{ key, label, anyLabel, options }];
			}
			const collections = this.collections();
			return collections
				? [
						{
							key,
							label,
							anyLabel,
							options: collections.map(({ slug, title }) => ({
								value: slug,
								label: title
							}))
						}
					]
				: [];
		})
	);
	public readonly columns = computed<readonly ListColumn[]>(
		() => this.config().columns
	);
	public readonly sortColumns = computed(() => toSortColumns(this.columns()));
	public readonly sort = computed(() =>
		currentSort(
			this.filters(),
			this.sortColumns(),
			this.config().defaultSort
		)
	);
	public readonly view = computed(() => this.config().view);
	/** The table's columns: the type's, with select and the row's menu. */
	public readonly columnCount = computed(() => this.columns().length + 2);
	public readonly cellContext: CellContext = {
		collectionTitle: (slug) => {
			const type = toCollectionType(this.type());
			if (!slug) {
				return '';
			}
			return type ? this.collectionsStore.titleOf(type, slug) : slug;
		}
	};
	/** In the type's default order: for orderable types, the site's. */
	public readonly isDefaultSort = computed(() => {
		const { sort, order } = this.config().defaultSort;
		return this.sort().sort === sort && this.sort().order === order;
	});
	/** Something has loaded for this type (until then, a placeholder). */
	public readonly hasLoaded = computed(
		() => this.loaded()?.type === this.type()
	);
	public readonly total = computed(() =>
		this.hasLoaded() ? this.loaded()!.page.total : 0
	);
	public readonly itemRows = computed(() => {
		const loaded = this.loaded();
		if (!this.hasLoaded() || !loaded) {
			return [];
		}
		const editedIds = new Set(
			loaded.drafts.flatMap(({ target }) => (target ? [target.id] : []))
		);
		return loaded.page.items.map((item) =>
			toItemRow(item, editedIds.has(item.id))
		);
	});
	public readonly draftRows = computed(() => {
		const loaded = this.loaded();
		if (!this.hasLoaded() || !loaded) {
			return [];
		}
		const items = new Map(loaded.page.items.map((item) => [item.id, item]));
		const editor = this.auth.user() ?? undefined;
		return filterDrafts(
			loaded.drafts,
			this.filters(),
			this.config().filters
		).map((draft) =>
			toDraftRow(draft, items.get(draft.target?.id ?? ''), editor)
		);
	});
	/** What Ctrl+A and the header checkbox select: every row on this page. */
	public readonly pageRows = computed(() => ({
		items: this.itemRows().map(({ ref }) => ref),
		draftIds: this.draftRows().map(({ id }) => id)
	}));
	public readonly pageRowCount = computed(
		() => this.itemRows().length + this.draftRows().length
	);
	public readonly selectedCount = computed(() =>
		this.selection.count(this.total())
	);
	public readonly selectedItemCount = computed(
		() => this.selectedCount() - this.selection.selectedDraftIds().length
	);
	/**
	 * The rows can be put in order: the type has an order, it's sorted by it
	 * (its default sort), one collection is chosen and nothing else filtered,
	 * every item is on this page, and nothing is saving.
	 */
	public readonly isReorderable = computed(() => {
		const { search, values } = this.filters();
		const setKeys = Object.keys(values);
		return (
			this.config().isOrderable &&
			setKeys.length === 1 &&
			setKeys[0] === COLLECTION_FILTER.key &&
			!search &&
			this.isDefaultSort() &&
			this.total() <= EDITOR_PAGE_SIZE &&
			!this.isBusy()
		);
	});
	/** Every item matching the filters, and the drafts listed with them. */
	public readonly selectableCount = computed(
		() => this.total() + this.draftRows().length
	);

	private readonly search = toSignal(
		toObservable(computed(() => this.filters().search)).pipe(
			debounceTime(EDITOR_SEARCH_DEBOUNCE_MS)
		),
		{ initialValue: this.filters().search }
	);
	/** Equal queries are one: typing waits for the debounced search. */
	public readonly request = computed(
		() => ({
			type: this.type(),
			query: toListQuery(
				this.filters(),
				this.search(),
				this.auth.user()?.id,
				this.sort(),
				this.config().filters
			),
			pageIndex: this.pageIndex()
		}),
		{ equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
	);

	/** Items are listed, not only the editor's drafts. */
	public readonly showsItems = computed(
		() => this.request().query !== undefined
	);

	constructor() {
		merge(
			toObservable(this.request),
			this.reloads.pipe(map(() => this.request()))
		)
			.pipe(switchMap((request) => this.load(request)))
			.subscribe();
	}

	public reload(): void {
		this.reloads.next();
	}

	/** Moves a loaded item, until the order is saved and the list reloads. */
	public moveItem(fromIndex: number, toIndex: number): void {
		this.loaded.update((loaded) => {
			if (!loaded) {
				return loaded;
			}
			const items = [...loaded.page.items];
			moveItemInArray(items, fromIndex, toIndex);
			return { ...loaded, page: { ...loaded.page, items } };
		});
	}

	public setFilters(filters: ListFilterSettings): void {
		this.navigate(toListParams(filters, 0, this.config().filters));
	}

	public setSort(sort: ListSort): void {
		this.setFilters({
			...this.filters(),
			...toSortParams(sort, this.config().defaultSort)
		});
	}

	public setPage(pageIndex: number): void {
		this.navigate(
			toListParams(this.filters(), pageIndex, this.config().filters)
		);
	}

	/** Opens a row in the editor modal, keeping the list's filters and scroll. */
	public open(row: ListRow): void {
		this.openModal(pathOf(row));
	}

	/** A row's editor URL, with the list's query. */
	public hrefOf(row: ListRow): string {
		return this.router.serializeUrl(
			this.router.createUrlTree(pathOf(row), {
				relativeTo: this.route,
				queryParamsHandling: 'preserve'
			})
		);
	}

	public openDraft(draftId: string): void {
		this.openModal(['drafts', draftId]);
	}

	/** One load: a page of items (unless only drafts are wanted) and the drafts. */
	private load({
		type,
		query,
		pageIndex
	}: {
		type: EditorContentType;
		query: ListQueryOf<EditorContentType> | undefined;
		pageIndex: number;
	}): Observable<unknown> {
		this.selection.clear();
		this.loadState.start();
		this.isLoading.set(true);
		const items = query
			? this.editorContent.fetchItems(type, {
					...query,
					startIndex: pageIndex * EDITOR_PAGE_SIZE,
					limit: EDITOR_PAGE_SIZE
				})
			: of({ items: [], total: 0 });
		const drafts = this.draftsService.fetchDrafts(type).pipe(
			catchError(() => of(this.loaded()?.drafts ?? [])),
			map((serverDrafts) =>
				this.draftStore.withPending(serverDrafts, type)
			)
		);
		return combineLatest([items, drafts]).pipe(
			tap(([page, drafts]) => {
				this.loaded.set({ type, page, drafts });
				this.loadState.succeed();
			}),
			catchError(() => {
				this.loadState.fail();
				return EMPTY;
			}),
			finalize(() => this.isLoading.set(false))
		);
	}

	private navigate(queryParams: Record<string, string | null>): void {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams,
			queryParamsHandling: 'merge',
			replaceUrl: true
		});
	}

	private openModal(path: string[]): void {
		this.router.navigate(path, {
			relativeTo: this.route,
			queryParamsHandling: 'preserve',
			scroll: 'manual'
		});
	}
}

function pathOf(row: ListRow): string[] {
	return row.kind === 'draft' ? ['drafts', row.id] : [row.id];
}
