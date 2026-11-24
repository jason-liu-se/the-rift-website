import {
	Component,
	ElementRef,
	Injector,
	afterNextRender,
	computed,
	inject,
	input,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { filter, skip, switchMap } from 'rxjs';
import {
	DraftSaveRequest,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { DraftSummary } from 'src/app/interfaces/api-responses';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { pickFields } from '../../drafts/draft-fields';
import { EDITOR_TYPES, toCollectionType } from '../../editor-types';
import { EditorWriteService } from '../../services/editor-write.service';
import { describeWriteError } from '../../utilities/write-errors';
import { CollectionsManagerComponent } from '../collections-manager/collections-manager.component';
import { CreateButtonComponent } from '../create-button/create-button.component';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { EditorListStore } from '../editor-list/editor-list.store';

/**
 * One tool, at /admin/<type>: its heading, creating, collections, and list,
 * with creating and editing in modals (child routes) over it.
 */
@Component({
	selector: 'app-editor-list-page',
	templateUrl: './editor-list-page.component.html',
	styleUrl: './editor-list-page.component.scss',
	imports: [
		CollectionsManagerComponent,
		CreateButtonComponent,
		EditorListComponent,
		MatButton,
		RouterOutlet
	],
	providers: [EditorListStore]
})
export class EditorListPageComponent {
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private editorContent = inject(EditorContentService);
	private drafts = inject(DraftsService);
	private writer = inject(EditorWriteService);
	private injector = inject(Injector);
	private heading = viewChild.required<ElementRef<HTMLElement>>('heading');

	protected readonly store = inject(EditorListStore);

	/** From the URL. */
	public readonly type = input.required<EditorContentType>();

	protected readonly isManagingCollections = signal(false);

	protected readonly config = computed(() => EDITOR_TYPES[this.type()]);
	protected readonly collectionType = computed(() =>
		toCollectionType(this.type())
	);

	constructor() {
		// Switching tools keeps this page: say so by moving focus to the new
		// heading (on first load, PageTemplateComponent handles focus).
		toObservable(this.type)
			.pipe(skip(1), takeUntilDestroyed())
			.subscribe(() => {
				this.isManagingCollections.set(false);
				afterNextRender(() => this.heading().nativeElement.focus(), {
					injector: this.injector
				});
			});
	}

	protected openItem(item: SummaryOf<EditorContentType>): void {
		this.openModal([item.id]);
	}

	protected openDraft(draft: DraftSummary): void {
		this.openModal(['drafts', draft.id]);
	}

	/** Saves a copy of the item as a new draft, then opens it. */
	protected duplicate(item: SummaryOf<EditorContentType>): void {
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
				this.openModal(['drafts', draftId]);
			});
	}

	/** Opens a modal route over the list, keeping its filters and scroll. */
	private openModal(path: string[]): void {
		this.router.navigate(path, {
			relativeTo: this.route,
			queryParamsHandling: 'preserve',
			scroll: 'manual'
		});
	}
}
