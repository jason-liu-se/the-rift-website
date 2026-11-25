import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
	Component,
	computed,
	inject,
	input,
	linkedSignal,
	output,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import {
	MAX_COLLECTION_SLUG_LENGTH,
	MAX_COLLECTION_TITLE_LENGTH
} from 'src/app/config/content-limits';
import {
	CollectionCreateRequest,
	CollectionUpdateRequest,
	ImageUploadForm
} from 'src/app/interfaces/api-requests';
import { Dimension, EditorCollection } from 'src/app/interfaces/api-responses';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { CollectionsStore } from '../../services/collections-store.service';
import { EditorWriteService } from '../../services/editor-write.service';
import { describeWriteError } from '../../utilities/write-errors';
import { DimensionsEditorComponent } from '../dimensions-editor/dimensions-editor.component';
import { findSlugProblem, toSlug } from './collection-slug';

/**
 * A collection's form: a new one (its slug following the title until edited,
 * fixed once created), or an existing one's title and dimensions.
 */
@Component({
	selector: 'app-collection-form',
	templateUrl: './collection-form.component.html',
	styleUrl: './collection-form.component.scss',
	imports: [
		DimensionsEditorComponent,
		FormsModule,
		MatButton,
		MatCheckbox,
		MatFormField,
		MatHint,
		MatIcon,
		MatInput,
		MatLabel
	]
})
export class CollectionFormComponent {
	private editorContent = inject(EditorContentService);
	private writer = inject(EditorWriteService);
	private store = inject(CollectionsStore);

	public readonly type = input.required<CollectionContentType>();
	/** The collection to edit; none to create one. */
	public readonly collection = input<EditorCollection>();
	/** It was created or saved. */
	public readonly saved = output<void>();
	public readonly cancelled = output<void>();

	protected readonly maxSlugLength = MAX_COLLECTION_SLUG_LENGTH;
	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	protected readonly title = linkedSignal(
		() => this.collection()?.title ?? ''
	);
	protected readonly slug = linkedSignal(() => this.collection()?.slug ?? '');
	protected readonly dimensions = linkedSignal<Dimension[]>(() => [
		...(this.collection()?.dimensions ?? [])
	]);
	protected readonly isVisible = signal(true);
	protected readonly isSaving = signal(false);
	/** The slug was typed, so it no longer follows the title. */
	private readonly isSlugEdited = linkedSignal(() => !!this.collection());
	/** Problems show once saving was tried. */
	private readonly wasAttempted = linkedSignal({
		source: this.collection,
		computation: () => false
	});

	protected readonly urlPrefix = computed(() =>
		this.type() === 'gallery' ? '/gallery/' : undefined
	);
	protected readonly shownSlugProblem = computed(() =>
		this.wasAttempted() && !this.collection()
			? findSlugProblem(this.slug())
			: undefined
	);
	protected readonly shownDimensionsProblem = computed(() =>
		this.wasAttempted()
			? findDimensionsProblem(this.dimensions())
			: undefined
	);
	/** The gallery's uploads go in the collection's album, so need its slug. */
	protected readonly album = computed<ImageUploadForm | undefined>(() => {
		if (this.type() === 'downloads') {
			return { album: 'downloads' };
		}
		const slug = this.slug();
		return findSlugProblem(slug)
			? undefined
			: { album: 'gallery', collection: slug };
	});

	protected setTitle(title: string): void {
		this.title.set(title);
		if (!this.isSlugEdited()) {
			this.slug.set(toSlug(title));
		}
	}

	protected setSlug(slug: string): void {
		this.isSlugEdited.set(true);
		this.slug.set(slug);
	}

	protected save(): void {
		const title = this.title().trim();
		const dimensions = this.dimensions().map(({ name, imageUrl }) => ({
			name: name.trim(),
			imageUrl
		}));
		this.wasAttempted.set(true);
		const existing = this.collection();
		if (
			!title ||
			(!existing && findSlugProblem(this.slug())) ||
			findDimensionsProblem(dimensions)
		) {
			return;
		}
		this.isSaving.set(true);
		const slug = this.slug();
		this.writer
			.run({
				request: () =>
					existing
						? this.editorContent.updateCollection(
								this.type(),
								existing.slug,
								{
									title,
									dimensions,
									startingRevision: existing.revision
								} satisfies CollectionUpdateRequest
							)
						: this.editorContent.createCollection(this.type(), {
								slug,
								title,
								...(dimensions.length > 0 && { dimensions }),
								visible: this.isVisible()
							} satisfies CollectionCreateRequest),
				success: existing ? `Saved ${title}.` : `Created ${title}.`,
				describeFailure: (error) =>
					!existing && isSlugTaken(error)
						? `The slug ${slug} is taken. Choose another.`
						: describeWriteError(error)
			})
			.subscribe((isSaved) => {
				this.isSaving.set(false);
				// Also after a conflict: it brings the current revision.
				this.store.reload(this.type());
				if (!isSaved) {
					return;
				}
				this.saved.emit();
				if (!existing) {
					this.reset();
				}
			});
	}

	private reset(): void {
		this.title.set('');
		this.slug.set('');
		this.dimensions.set([]);
		this.isSlugEdited.set(false);
		this.wasAttempted.set(false);
	}
}

/** Why the dimensions can't be saved, or undefined if they can. */
export function findDimensionsProblem(
	dimensions: readonly Dimension[]
): string | undefined {
	return dimensions.some(({ name, imageUrl }) => !name.trim() || !imageUrl)
		? 'Give every dimension a name and an image.'
		: undefined;
}

/** A 409 without the item: the slug is already taken. */
function isSlugTaken(error: unknown): boolean {
	return (
		error instanceof HttpErrorResponse &&
		error.status === HttpStatusCode.Conflict &&
		!error.error?.current
	);
}
