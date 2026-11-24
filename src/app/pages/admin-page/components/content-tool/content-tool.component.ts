import { NgComponentOutlet } from '@angular/common';
import {
	Component,
	DestroyRef,
	computed,
	effect,
	inject,
	input,
	signal,
	untracked,
	viewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { EDITOR_PARAMS } from 'src/app/config/admin';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { FocusRecoveryService } from 'src/app/services/focus-recovery/focus-recovery.service';
import { DraftSession } from '../../drafts/draft-session';
import { CollectionsManagerComponent } from '../collections-manager/collections-manager.component';
import { DraftSessionsService } from '../../drafts/draft-sessions.service';
import { DraftSyncService } from '../../drafts/draft-sync.service';
import { describeWriteError } from '../../utilities/write-errors';
import {
	DraftEditorComponent,
	PublishedState
} from '../draft-editor/draft-editor.component';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { GalleryBulkCreateComponent } from '../gallery/gallery-bulk-create/gallery-bulk-create.component';
import { EDITOR_TYPES, toCollectionType } from '../../editor-types';

/**
 * One admin tool: its list, or the editor for one item or draft (the type's
 * form in the shared draft editor), as the URL says.
 */
@Component({
	selector: 'app-content-tool',
	templateUrl: './content-tool.component.html',
	styleUrl: './content-tool.component.scss',
	imports: [
		CollectionsManagerComponent,
		DraftEditorComponent,
		EditorListComponent,
		GalleryBulkCreateComponent,
		MatButton,
		NgComponentOutlet
	]
})
export class ContentToolComponent<T extends EditorContentType> {
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private sessions = inject(DraftSessionsService);
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);
	private sync = inject(DraftSyncService);
	private focusRecovery = inject(FocusRecoveryService);
	private apiStatus = inject(ApiStatusService).status;
	private queryParams = toSignal(this.route.queryParamMap);
	private list = viewChild(EditorListComponent);

	public readonly type = input.required<T>();

	protected readonly session = signal<DraftSession<T> | undefined>(undefined);
	protected readonly published = signal<PublishedState | undefined>(
		undefined
	);
	protected readonly isOpening = signal(false);
	protected readonly isManagingCollections = signal(false);
	protected readonly isBulkCreating = signal(false);

	protected readonly config = computed(() => EDITOR_TYPES[this.type()]);
	protected readonly collectionType = computed(() =>
		toCollectionType(this.type())
	);

	constructor() {
		this.sync.syncPending();
		let openedFrom = '';
		effect(() => {
			const params = this.queryParams();
			untracked(() => {
				const key = params ? toKey(params) : '';
				if (params && key !== openedFrom) {
					openedFrom = key;
					this.openFromUrl(params);
				}
			});
		});
		// A new draft gets its own URL once it's saved, so a reload reopens it.
		effect(() => {
			const session = this.session();
			if (
				!session ||
				session.isEdit() ||
				session.status() === 'unchanged'
			) {
				return;
			}
			untracked(() => {
				if (
					this.queryParams()?.get(EDITOR_PARAMS.draft) !==
					session.id()
				) {
					openedFrom = `${EDITOR_PARAMS.draft}=${session.id()}`;
					this.navigate(
						{ [EDITOR_PARAMS.draft]: session.id() },
						true
					);
				}
			});
		});
		// The API is back: send what was saved only here.
		let previousStatus = this.apiStatus();
		effect(() => {
			const status = this.apiStatus();
			untracked(() => {
				if (previousStatus !== 'up' && status === 'up') {
					this.session()
						?.saveNow()
						.subscribe({ error: () => undefined });
					this.sync.syncPending(this.session()?.id());
				}
				previousStatus = status;
			});
		});
		inject(DestroyRef).onDestroy(() => this.session()?.close());
	}

	/** Fetches the list again (e.g. a collection changed). */
	public reloadList(): void {
		this.list()?.reloadItems();
	}

	protected openNew(): void {
		this.navigate({ [EDITOR_PARAMS.new]: '' });
	}

	protected openEditor(param: keyof typeof EDITOR_PARAMS, id: string): void {
		this.navigate({ [EDITOR_PARAMS[param]]: id });
	}

	protected closeEditor(): void {
		this.navigate({});
		this.focusRecovery.recoverAfterRender();
	}

	private openFromUrl(params: ParamMap): void {
		this.session()?.close();
		this.session.set(undefined);
		this.published.set(undefined);
		const type = this.type();
		const id = (name: string) => params.get(name);
		let opening: Observable<DraftSession<T>> | undefined;
		if (params.has(EDITOR_PARAMS.new)) {
			opening = of(
				this.sessions.startNew(type, EDITOR_TYPES[type].newItemFields())
			);
		} else if (id(EDITOR_PARAMS.edit)) {
			opening = this.fetchPublished(id(EDITOR_PARAMS.edit)!).pipe(
				switchMap((item) => this.sessions.startEdit(type, item))
			);
		} else if (id(EDITOR_PARAMS.duplicate)) {
			opening = this.editorContent
				.fetchItem(type, id(EDITOR_PARAMS.duplicate)!)
				.pipe(map((item) => this.sessions.startCopy(type, item)));
		} else if (id(EDITOR_PARAMS.draft)) {
			opening = this.sessions
				.openDraft(type, id(EDITOR_PARAMS.draft)!)
				.pipe(switchMap((session) => this.withPublished(session)));
		}
		if (!opening) {
			return;
		}
		this.isOpening.set(true);
		opening.subscribe({
			next: (session) => {
				this.isOpening.set(false);
				this.session.set(session);
			},
			error: (error: unknown) => {
				this.isOpening.set(false);
				this.notifier.notifyFailure(
					`Couldn't open it. ${describeWriteError(error)}`
				);
				this.closeEditor();
			}
		});
	}

	/** Fetches the published item, keeping its visibility and date. */
	private fetchPublished(id: string): Observable<ItemOf<T>> {
		return this.editorContent.fetchItem(this.type(), id).pipe(
			map((item) => {
				const { visible, date } = item as ItemOf<T> & { date?: string };
				this.published.set({ visible, date });
				return item;
			})
		);
	}

	/** An edit draft's item's visibility and date (if it can be fetched). */
	private withPublished(
		session: DraftSession<T>
	): Observable<DraftSession<T>> {
		const targetId = session.targetId();
		return targetId
			? this.fetchPublished(targetId).pipe(
					map(() => session),
					catchError(() => of(session))
				)
			: of(session);
	}

	/**
	 * Sets the editor's parameters (`{}` closes the editor), keeping the
	 * list's filters in the URL for when it shows again.
	 */
	private navigate(editorParams: Params, replaceUrl = false): void {
		const noEditor = Object.fromEntries(
			Object.values(EDITOR_PARAMS).map((name) => [name, null])
		);
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { ...noEditor, ...editorParams },
			queryParamsHandling: 'merge',
			preserveFragment: true,
			replaceUrl
		});
	}
}

/** The editor parameters in the URL, as one comparable string. */
function toKey(params: ParamMap): string {
	return Object.values(EDITOR_PARAMS)
		.filter((name) => params.has(name))
		.map((name) => `${name}=${params.get(name)}`)
		.join('&');
}
