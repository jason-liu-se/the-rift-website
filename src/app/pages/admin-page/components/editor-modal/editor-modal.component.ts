import { NgComponentOutlet } from '@angular/common';
import {
	Component,
	DestroyRef,
	TemplateRef,
	computed,
	inject,
	input,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
	EMPTY,
	Observable,
	catchError,
	filter,
	map,
	of,
	switchMap
} from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { DraftSession } from '../../drafts/draft-session';
import { DraftSessionsService } from '../../drafts/draft-sessions.service';
import { EDITOR_TYPES } from '../../editor-types';
import { openModalRoute } from '../../utilities/modal-route';
import { describeWriteError } from '../../utilities/write-errors';
import {
	DraftEditorComponent,
	PublishedState
} from '../draft-editor/draft-editor.component';
import { EditorListStore } from '../editor-list/editor-list.store';

interface EditorTarget {
	id?: string;
	draftId?: string;
}

/**
 * The editor modal over a tool's list: a new item (`new`), a draft
 * (`drafts/<draftId>`), or a published item (`<id>`, resuming the editor's
 * draft of it). A new item's draft gets its own URL once it's saved, so a
 * reload reopens it.
 */
@Component({
	selector: 'app-editor-modal',
	templateUrl: './editor-modal.component.html',
	imports: [DraftEditorComponent, NgComponentOutlet]
})
export class EditorModalComponent {
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private sessions = inject(DraftSessionsService);
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);
	private listStore = inject(EditorListStore);
	private content = viewChild.required<TemplateRef<unknown>>('content');

	/** From the URL. */
	public readonly id = input<string>();
	/** From the URL. */
	public readonly draftId = input<string>();

	protected readonly type = this.route.parent!.snapshot.paramMap.get(
		'type'
	) as EditorContentType;
	protected readonly config = EDITOR_TYPES[this.type];
	protected readonly session = signal<
		DraftSession<EditorContentType> | undefined
	>(undefined);
	protected readonly published = signal<PublishedState | undefined>(
		undefined
	);
	protected readonly close = openModalRoute(() => this.content());

	private readonly target = computed<EditorTarget>(
		() => ({ id: this.id(), draftId: this.draftId() }),
		{ equal: (a, b) => a.id === b.id && a.draftId === b.draftId }
	);
	/** A new item's draft, once saved, while its URL is still `new`. */
	private readonly unlinkedDraftId = computed(() => {
		const session = this.session();
		const isSaved = session && session.status() !== 'unchanged';
		return isSaved && !session.isEdit() && !this.draftId()
			? session.id()
			: undefined;
	});

	constructor() {
		toObservable(this.target)
			.pipe(
				// Its own new draft getting a URL isn't a different item.
				filter(
					({ draftId }) =>
						!draftId || draftId !== this.session()?.id()
				),
				switchMap((target) => this.open(target)),
				takeUntilDestroyed()
			)
			.subscribe((session) => this.setSession(session));
		toObservable(this.unlinkedDraftId)
			.pipe(filter(Boolean), takeUntilDestroyed())
			.subscribe((draftId) =>
				this.router.navigate(['drafts', draftId], {
					relativeTo: this.route.parent,
					queryParamsHandling: 'preserve',
					replaceUrl: true,
					scroll: 'manual'
				})
			);
		inject(DestroyRef).onDestroy(() => this.setSession(undefined));
	}

	protected finishPublishing(): void {
		this.listStore.reload();
		this.close();
	}

	private setSession(
		session: DraftSession<EditorContentType> | undefined
	): void {
		this.session()?.close();
		this.session.set(session);
	}

	private open({
		id,
		draftId
	}: EditorTarget): Observable<DraftSession<EditorContentType>> {
		this.setSession(undefined);
		this.published.set(undefined);
		const opening = draftId
			? this.sessions
					.openDraft(this.type, draftId)
					.pipe(switchMap((session) => this.withPublished(session)))
			: id
				? this.fetchPublished(id).pipe(
						switchMap((item) =>
							this.sessions.startEdit(this.type, item)
						)
					)
				: of(
						this.sessions.startNew(
							this.type,
							this.config.newItemFields()
						)
					);
		return opening.pipe(
			catchError((error: unknown) => {
				this.notifier.notifyFailure(
					`Couldn't open it. ${describeWriteError(error)}`
				);
				this.close();
				return EMPTY;
			})
		);
	}

	/** Fetches the published item, keeping its visibility and date. */
	private fetchPublished(id: string): Observable<ItemOf<EditorContentType>> {
		return this.editorContent.fetchItem(this.type, id).pipe(
			map((item) => {
				const { visible, date } = item as {
					visible: boolean;
					date?: string;
				};
				this.published.set({ visible, date });
				return item;
			})
		);
	}

	/** An edit draft's item's visibility and date (if it can be fetched). */
	private withPublished(
		session: DraftSession<EditorContentType>
	): Observable<DraftSession<EditorContentType>> {
		const targetId = session.targetId();
		return targetId
			? this.fetchPublished(targetId).pipe(
					map(() => session),
					catchError(() => of(session))
				)
			: of(session);
	}
}
