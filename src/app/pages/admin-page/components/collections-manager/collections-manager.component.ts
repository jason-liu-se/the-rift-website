import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
	Component,
	computed,
	inject,
	input,
	output,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable, tap } from 'rxjs';
import {
	MAX_COLLECTION_SLUG_LENGTH,
	MAX_COLLECTION_TITLE_LENGTH
} from 'src/app/config/content-limits';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { describeWriteError } from '../../utilities/write-errors';
import { CollectionsStore } from '../../services/collections-store.service';
import {
	EditorWrite,
	EditorWriteService
} from '../../services/editor-write.service';
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
	private writer = inject(EditorWriteService);
	private store = inject(CollectionsStore);

	public readonly type = input.required<CollectionContentType>();
	/** How the collection's items are named: "image", "images". */
	public readonly itemNoun = input.required<ItemNoun>();
	/** A collection was created, changed, or deleted. */
	public readonly changed = output<void>();

	protected readonly maxSlugLength = MAX_COLLECTION_SLUG_LENGTH;
	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	protected readonly slug = signal('');
	protected readonly title = signal('');
	protected readonly isVisible = signal(true);
	protected readonly isSaving = signal(false);

	protected readonly collections = computed(
		() => this.store.collections(this.type())() ?? []
	);
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

	protected createCollection(): void {
		const title = this.title().trim();
		const slug = this.slug();
		this.isSaving.set(true);
		this.write({
			request: () =>
				this.editorContent.createCollection(this.type(), {
					slug,
					title,
					visible: this.isVisible()
				}),
			success: `Created ${title}.`,
			describeFailure: (error) =>
				isSlugTaken(error)
					? `The slug ${slug} is taken. Choose another.`
					: describeWriteError(error)
		}).subscribe((isCreated) => {
			this.isSaving.set(false);
			if (isCreated) {
				this.slug.set('');
				this.title.set('');
			}
		});
	}

	protected toggleVisibility(collection: EditorCollection): void {
		this.write({
			request: () =>
				this.editorContent.updateCollection(
					this.type(),
					collection.slug,
					{
						visible: !collection.visible,
						startingRevision: collection.revision
					}
				),
			success: `${collection.visible ? 'Hid' : 'Showed'} ${collection.title}.`
		}).subscribe();
	}

	protected deleteCollection(collection: EditorCollection): void {
		const items = countItems(collection.itemCount, this.itemNoun());
		this.write({
			confirm: {
				title: `Delete ${collection.title}?`,
				message: `This deletes the collection and the ${items} in it. It can't be undone.`,
				confirmLabel: `Delete it and ${items}`
			},
			request: () =>
				this.editorContent.deleteCollection(
					this.type(),
					collection.slug,
					collection.revision
				),
			success: `Deleted ${collection.title} and ${items}.`
		}).subscribe();
	}

	/** Runs the write, then reloads the collections and tells the list. */
	private write(write: EditorWrite): Observable<boolean> {
		return this.writer.run(write).pipe(
			tap(() => {
				this.store.reload(this.type());
				this.changed.emit();
			})
		);
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
