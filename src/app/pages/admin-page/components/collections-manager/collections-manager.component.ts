import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
	Component,
	computed,
	inject,
	input,
	output,
	signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable, filter, switchMap } from 'rxjs';
import {
	MAX_COLLECTION_SLUG_LENGTH,
	MAX_COLLECTION_TITLE_LENGTH
} from 'src/app/config/content-limits';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { describeWriteError } from '../../utilities/write-errors';
import { confirmAction } from '../confirm-dialog/confirm-dialog.component';
import { ItemNoun, countItems } from '../editor-list/bulk-results';

/** A collection's slug, as the API takes it: kebab-case. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Why `slug` can't be used, or undefined if it can. */
export function findSlugProblem(slug: string): string | undefined {
	if (!slug) {
		return undefined;
	}
	if (!SLUG_PATTERN.test(slug)) {
		return 'Use lowercase letters and numbers, with single hyphens between words (e.g. season-5).';
	}
	return undefined;
}

/**
 * A gallery's or downloads' collections: create one (its slug is fixed once
 * created), show or hide one, or delete one with everything in it.
 */
@Component({
	selector: 'app-collections-manager',
	templateUrl: './collections-manager.component.html',
	styleUrl: './collections-manager.component.scss',
	imports: [
		FormsModule,
		MatButton,
		MatCheckbox,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel
	]
})
export class CollectionsManagerComponent {
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);
	private dialog = inject(MatDialog);

	public readonly type = input.required<CollectionContentType>();
	/** How the collection's items are named: "image", "images". */
	public readonly itemNoun = input.required<ItemNoun>();
	/** A collection was created, changed, or deleted. */
	public readonly changed = output<void>();

	protected readonly maxSlugLength = MAX_COLLECTION_SLUG_LENGTH;
	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	protected readonly collections = signal<EditorCollection[]>([]);
	protected readonly slug = signal('');
	protected readonly title = signal('');
	protected readonly isVisible = signal(true);
	protected readonly isSaving = signal(false);
	protected readonly slugProblem = computed(() =>
		findSlugProblem(this.slug())
	);
	protected readonly canCreate = computed(
		() =>
			!!this.slug() &&
			!this.slugProblem() &&
			!!this.title().trim() &&
			!this.isSaving()
	);

	constructor() {
		toObservable(this.type)
			.pipe(
				switchMap((type) => this.editorContent.fetchCollections(type))
			)
			.subscribe({
				next: (collections) => this.collections.set(collections),
				error: (error: unknown) =>
					this.notifier.notifyFailure(
						`Couldn't load the collections. ${describeWriteError(error)}`
					)
			});
	}

	protected createCollection(): void {
		const title = this.title().trim();
		this.isSaving.set(true);
		this.write(
			this.editorContent.createCollection(this.type(), {
				slug: this.slug(),
				title,
				visible: this.isVisible()
			}),
			`Created ${title}.`,
			() => {
				this.slug.set('');
				this.title.set('');
			}
		);
	}

	protected toggleVisibility(collection: EditorCollection): void {
		this.write(
			this.editorContent.updateCollection(this.type(), collection.slug, {
				visible: !collection.visible,
				startingRevision: collection.revision
			}),
			`${collection.visible ? 'Hid' : 'Showed'} ${collection.title}.`
		);
	}

	protected deleteCollection(collection: EditorCollection): void {
		const items = countItems(collection.itemCount, this.itemNoun());
		confirmAction(this.dialog, {
			title: `Delete ${collection.title}?`,
			message: `This deletes the collection and the ${items} in it. It can't be undone.`,
			confirmLabel: `Delete it and ${items}`
		})
			.pipe(filter(Boolean))
			.subscribe(() =>
				this.write(
					this.editorContent.deleteCollection(
						this.type(),
						collection.slug,
						collection.revision
					),
					`Deleted ${collection.title} and ${items}.`
				)
			);
	}

	private write(
		request: Observable<unknown>,
		successMessage: string,
		onSuccess?: () => void
	): void {
		request.subscribe({
			next: () => {
				this.notifier.notifySuccess(successMessage);
				onSuccess?.();
			},
			error: (error: unknown) => {
				this.isSaving.set(false);
				this.notifier.notifyFailure(
					isSlugTaken(error)
						? `The slug ${this.slug()} is taken. Choose another.`
						: describeWriteError(error)
				);
				this.reload();
			},
			complete: () => {
				this.isSaving.set(false);
				this.reload();
			}
		});
	}

	private reload(): void {
		this.editorContent.fetchCollections(this.type()).subscribe({
			next: (collections) => this.collections.set(collections),
			error: () => undefined
		});
		this.changed.emit();
	}
}

/** A 409 without the item: the slug is already taken. */
function isSlugTaken(error: unknown): boolean {
	return (
		error instanceof HttpErrorResponse &&
		error.status === HttpStatusCode.Conflict &&
		!error.error?.current
	);
}
