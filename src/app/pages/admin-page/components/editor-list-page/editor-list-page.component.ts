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
import { RouterOutlet } from '@angular/router';
import { skip } from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { EDITOR_TYPES, toCollectionType } from '../../editor-types';
import { CollectionsManagerComponent } from '../collections-manager/collections-manager.component';
import { CreateButtonComponent } from '../create-button/create-button.component';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { BULK_ACTION_HOST } from '../editor-list/bulk-action-host';
import { EditorListActions } from '../editor-list/editor-list.actions';
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
	providers: [
		EditorListStore,
		EditorListActions,
		{ provide: BULK_ACTION_HOST, useExisting: EditorListActions }
	]
})
export class EditorListPageComponent {
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
}
