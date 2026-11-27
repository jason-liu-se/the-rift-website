import {
	Injectable,
	Injector,
	inject,
	runInInjectionContext
} from '@angular/core';
import { Observable, catchError, isObservable, map, of, switchMap } from 'rxjs';
import { EditorContentType } from 'src/app/core/api/api-requests';
import {
	BrowserStorage,
	STORAGE_KEYS
} from 'src/app/core/browser-storage/browser-storage';
import { CollectionsStore } from '../collections-store';
import { DraftFields } from '../drafts/draft-fields';
import { DraftSession } from '../drafts/draft-session';
import { DraftSessions } from '../drafts/draft-sessions';
import { EditorContentApi } from '../editor-content/editor-content-api';
import { ItemOf } from '../editor-content/editor-content-types';
import { EditorListStore } from '../editor-list/editor-list-store';
import { COLLECTION_FILTER } from '../editor-list/list-filter-fields';
import { EDITOR_TYPES, toCollectionType } from '../editor-type-configs';

/** What the editor opens: a published item (`id`), a draft, or neither (new). */
export interface EditorTarget {
	id?: string;
	draftId?: string;
}

export interface OpenedEditor {
	session: DraftSession<EditorContentType>;
	/** The published item it edits, when it could be fetched. */
	published?: ItemOf<EditorContentType>;
}

/**
 * Starts the editor's session for its URL, with what a new item starts with
 * (its type's fields, in the right collection). Provided by the editor modal.
 */
@Injectable()
export class EditorSessionOpener {
	private sessions = inject(DraftSessions);
	private editorContent = inject(EditorContentApi);
	private injector = inject(Injector);
	private listStore = inject(EditorListStore);
	private storage = inject(BrowserStorage);
	private collectionsStore = inject(CollectionsStore);

	public open(
		type: EditorContentType,
		{ id, draftId }: EditorTarget
	): Observable<OpenedEditor> {
		if (draftId) {
			return this.sessions
				.openDraft(type, draftId)
				.pipe(
					switchMap((session) => this.withPublished(type, session))
				);
		}
		if (id) {
			return this.editorContent
				.fetchItem(type, id)
				.pipe(
					switchMap((published) =>
						this.sessions
							.startEdit(type, published)
							.pipe(map((session) => ({ session, published })))
					)
				);
		}
		return this.newItemFields(type).pipe(
			map((fields) => ({ session: this.sessions.startNew(type, fields) }))
		);
	}

	/** Remembers the collection published to, for the next new item. */
	public rememberCollection(
		type: EditorContentType,
		fields: DraftFields<EditorContentType>
	): void {
		const { collection } = fields as { collection?: string };
		if (collection) {
			this.storage.set('local', lastCollectionKey(type), collection);
		}
	}

	private newItemFields(
		type: EditorContentType
	): Observable<DraftFields<EditorContentType>> {
		const fields = runInInjectionContext(this.injector, () =>
			EDITOR_TYPES[type].newItemFields()
		);
		return (isObservable(fields) ? fields : of(fields)).pipe(
			map((typeFields) => this.withDefaultCollection(type, typeFields))
		);
	}

	/**
	 * The collection the list shows, else the one last published to, else the
	 * first.
	 */
	private withDefaultCollection(
		type: EditorContentType,
		fields: DraftFields<EditorContentType>
	): DraftFields<EditorContentType> {
		const collectionType = toCollectionType(type);
		if (!collectionType) {
			return fields;
		}
		const slugs = (
			this.collectionsStore.collections(collectionType)() ?? []
		).map(({ slug }) => slug);
		const candidates = [
			this.listStore.filters().values[COLLECTION_FILTER.key],
			this.storage.get('local', lastCollectionKey(type))
		];
		const collection =
			candidates.find((slug) => slug && slugs.includes(slug)) ?? slugs[0];
		return collection ? { ...fields, collection } : fields;
	}

	/** An edit draft's published item, if it can be fetched. */
	private withPublished(
		type: EditorContentType,
		session: DraftSession<EditorContentType>
	): Observable<OpenedEditor> {
		const targetId = session.targetId();
		if (!targetId) {
			return of({ session });
		}
		return this.editorContent.fetchItem(type, targetId).pipe(
			map((published) => ({ session, published })),
			catchError(() => of({ session }))
		);
	}
}

function lastCollectionKey(type: EditorContentType): string {
	return STORAGE_KEYS.lastCollectionPrefix + type;
}
