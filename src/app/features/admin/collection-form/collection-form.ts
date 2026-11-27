import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
	Component,
	computed,
	input,
	linkedSignal,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
	MAX_COLLECTION_SLUG_LENGTH,
	MAX_COLLECTION_TITLE_LENGTH
} from 'src/app/core/config/content-limits';
import { Dimension, EditorCollection } from 'src/app/core/api/api-responses';
import { CollectionContentType } from 'src/app/features/admin/editor-content/editor-content-types';
import { DraftPublisher } from '../drafts/draft-publisher';
import {
	COLLECTION_FIELD_LABELS,
	COLLECTION_NOUN,
	COLLECTION_TYPES
} from '../collection-type-configs';
import { CollectionSession } from '../collections-modal/collections-editor';
import { DimensionsEditor } from '../dimensions-editor/dimensions-editor';
import { DraftConflict } from '../draft-editor/draft-conflict/draft-conflict';
import { DraftFooter } from '../draft-footer/draft-footer';
import {
	DraftHistory,
	handleHistoryShortcut
} from '../draft-history/draft-history';
import { ModalFooter } from '../modal-shell/modal-footer-slot';
import { findSlugProblem, toSlug } from './collection-slug';

/**
 * A collection's draft: a new one (its slug following the title until
 * edited, fixed once created) or an existing one's title and dimensions,
 * saved as it's typed. Its footer (save status, Discard, visibility,
 * Publish) goes in the modal's footer.
 */
@Component({
	selector: 'app-collection-form',
	templateUrl: './collection-form.html',
	styleUrl: './collection-form.scss',
	imports: [
		DimensionsEditor,
		DraftConflict,
		DraftFooter,
		DraftHistory,
		FormsModule,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel,
		ModalFooter
	],
	host: { '(keydown)': 'handleShortcuts($event)' }
})
export class CollectionForm {
	public readonly type = input.required<CollectionContentType>();
	public readonly session = input.required<CollectionSession>();
	public readonly published = output<EditorCollection>();
	public readonly discarded = output<void>();

	protected readonly noun = COLLECTION_NOUN;
	protected readonly fieldLabels = COLLECTION_FIELD_LABELS;
	protected readonly maxSlugLength = MAX_COLLECTION_SLUG_LENGTH;
	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	/** Problems show once publishing was tried. */
	private readonly wasAttempted = linkedSignal({
		source: this.session,
		computation: () => false
	});

	protected readonly fields = computed(() => this.session().fields());
	protected readonly isEdit = computed(() => this.session().isEdit());
	protected readonly urlPrefix = computed(
		() => COLLECTION_TYPES[this.type()].pathPrefix
	);
	private readonly slugProblem = computed(() =>
		this.isEdit() ? undefined : findSlugProblem(this.fields().slug ?? '')
	);
	private readonly dimensionsProblem = computed(() =>
		findDimensionsProblem(this.fields().dimensions ?? [])
	);
	protected readonly shownSlugProblem = computed(() =>
		this.wasAttempted() ? this.slugProblem() : undefined
	);
	protected readonly shownDimensionsProblem = computed(() =>
		this.wasAttempted() ? this.dimensionsProblem() : undefined
	);
	protected readonly album = computed(() =>
		COLLECTION_TYPES[this.type()].uploadAlbum(this.fields().slug ?? '')
	);
	protected readonly publisher = new DraftPublisher({
		session: this.session,
		noun: () => COLLECTION_NOUN.one,
		isEdit: this.isEdit,
		wasAttempted: this.wasAttempted,
		findProblem: () => this.findPublishProblem(),
		nameOf: (collection) => collection.title,
		describeFailure: (error) =>
			isSlugTaken(error)
				? `The slug ${this.fields().slug} is taken. Choose another.`
				: undefined,
		onPublished: (collection) => this.published.emit(collection),
		onDiscarded: () => this.discarded.emit()
	});

	/** A new collection's slug follows its title until it's typed. */
	protected setTitle(title: string): void {
		const { title: previous, slug } = this.fields();
		const isSlugFollowing =
			!this.isEdit() && (slug ?? '') === toSlug(previous ?? '');
		this.session().update({
			title,
			...(isSlugFollowing && { slug: toSlug(title) })
		});
	}

	protected setSlug(slug: string): void {
		this.session().update({ slug });
	}

	protected setDimensions(dimensions: Dimension[]): void {
		this.session().update({ dimensions });
	}

	protected handleShortcuts(event: KeyboardEvent): void {
		handleHistoryShortcut(event, this.session());
	}

	private findPublishProblem(): string | undefined {
		const { title, slug } = this.fields();
		if (!title?.trim() || (!this.isEdit() && !slug)) {
			return 'Fields marked * are required.';
		}
		return this.slugProblem() || this.dimensionsProblem()
			? 'Fix the problems marked above.'
			: undefined;
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
