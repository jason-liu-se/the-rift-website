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
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable, filter } from 'rxjs';
import {
	MAX_COLLECTION_SLUG_LENGTH,
	MAX_COLLECTION_TITLE_LENGTH
} from 'src/app/core/config/content-limits';
import { ImageUploadForm } from 'src/app/core/api/api-requests';
import { Dimension, EditorCollection } from 'src/app/core/api/api-responses';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { CollectionContentType } from 'src/app/features/admin/editor-content/editor-content-types';
import { discardDraft } from '../drafts/discard-draft';
import { EditorWriter } from '../editor-writer';
import { describeWriteError } from '../write-errors';
import { CollectionSession } from '../collections-modal/collections-editor';
import { DimensionsEditor } from '../dimensions-editor/dimensions-editor';
import { DraftConflict } from '../draft-editor/draft-conflict/draft-conflict';
import { ItemNoun } from '../editor-list/bulk-results';
import { DraftFooter } from '../draft-footer/draft-footer';
import {
	DraftHistory,
	handleHistoryShortcut
} from '../draft-history/draft-history';
import { ModalFooter } from '../modal-shell/modal-footer-slot';
import { findSlugProblem, toSlug } from './collection-slug';

const NOUN: ItemNoun = { one: 'collection', many: 'collections' };

/** A collection's fields, as a conflict lists their version beside mine. */
const FIELD_LABELS = {
	title: 'Title',
	slug: 'Slug',
	dimensions: 'Dimensions'
};

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
	private notifier = inject(AdminNotifier);
	private writer = inject(EditorWriter);

	public readonly type = input.required<CollectionContentType>();
	public readonly session = input.required<CollectionSession>();
	public readonly published = output<EditorCollection>();
	public readonly discarded = output<void>();

	protected readonly noun = NOUN;
	protected readonly fieldLabels = FIELD_LABELS;
	protected readonly maxSlugLength = MAX_COLLECTION_SLUG_LENGTH;
	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	protected readonly isPublishing = signal(false);
	/** Problems show once publishing was tried. */
	private readonly wasAttempted = linkedSignal({
		source: this.session,
		computation: () => false
	});

	protected readonly fields = computed(() => this.session().fields());
	protected readonly isEdit = computed(() => this.session().isEdit());
	protected readonly urlPrefix = computed(() =>
		this.type() === 'gallery' ? '/gallery/' : undefined
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
	/** In the footer, once publishing was tried. */
	protected readonly publishProblem = computed(() => {
		if (!this.wasAttempted()) {
			return undefined;
		}
		const { title, slug } = this.fields();
		if (!title?.trim() || (!this.isEdit() && !slug)) {
			return 'Fields marked * are required.';
		}
		return this.slugProblem() || this.dimensionsProblem()
			? 'Fix the problems marked above.'
			: undefined;
	});
	/** The gallery's uploads go in the collection's album, so need its slug. */
	protected readonly album = computed<ImageUploadForm | undefined>(() => {
		if (this.type() === 'downloads') {
			return { album: 'downloads' };
		}
		const slug = this.fields().slug ?? '';
		return findSlugProblem(slug)
			? undefined
			: { album: 'gallery', collection: slug };
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

	protected publish(): void {
		this.runPublish(() => this.session().publish({}));
	}

	protected publishAsNew(): void {
		this.runPublish(() => this.session().publishAsNew({}));
	}

	protected overwrite(): void {
		this.session()
			.resolveItemConflict('overwrite')
			.subscribe({ complete: () => this.publish() });
	}

	/** The conflict's way out when the collection was deleted. */
	protected discard(): void {
		discardDraft(this.writer, this.session(), NOUN.one, this.isEdit())
			.pipe(filter(Boolean))
			.subscribe(() => this.discarded.emit());
	}

	protected handleShortcuts(event: KeyboardEvent): void {
		handleHistoryShortcut(event, this.session());
	}

	private runPublish(publish: () => Observable<EditorCollection>): void {
		this.wasAttempted.set(true);
		if (this.publishProblem()) {
			return;
		}
		const slug = this.fields().slug;
		this.isPublishing.set(true);
		publish().subscribe({
			next: (collection) => {
				this.isPublishing.set(false);
				this.notifier.notifySuccess(`Published ${collection.title}.`);
				this.published.emit(collection);
			},
			error: (error: unknown) => {
				this.isPublishing.set(false);
				if (this.session().conflict()) {
					return;
				}
				this.notifier.notifyFailure(
					isSlugTaken(error)
						? `The slug ${slug} is taken. Choose another.`
						: error instanceof Error && !('status' in error)
							? error.message
							: describeWriteError(error)
				);
			}
		});
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
