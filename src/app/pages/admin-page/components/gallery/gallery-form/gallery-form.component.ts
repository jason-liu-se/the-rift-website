import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { catchError, of, switchMap } from 'rxjs';
import { CaptionCardComponent } from 'src/app/components/caption-card/caption-card.component';
import { MAX_GALLERY_CAPTION_LENGTH } from 'src/app/config/content-limits';
import { GalleryProviderService } from 'src/app/services/gallery-provider/gallery-provider.service';
import { DraftSession } from '../../../drafts/draft-session';
import { ImageFieldComponent } from '../../image-field/image-field.component';
import { TagInputComponent } from '../../tag-input/tag-input.component';
import { CollectionsStore } from '../../../services/collections-store.service';

/**
 * A gallery image's fields: its collection, image, caption, and tags (with
 * the collection's tags as suggestions), with a preview as the gallery shows it.
 */
@Component({
	selector: 'app-gallery-form',
	templateUrl: './gallery-form.component.html',
	styleUrl: './gallery-form.component.scss',
	imports: [
		CaptionCardComponent,
		FormsModule,
		ImageFieldComponent,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel,
		MatOption,
		MatSelect,
		TagInputComponent
	]
})
export class GalleryFormComponent {
	private galleryProvider = inject(GalleryProviderService);

	public readonly session = input.required<DraftSession<'gallery'>>();

	protected readonly maxCaptionLength = MAX_GALLERY_CAPTION_LENGTH;
	protected readonly fields = computed(() => this.session().fields());
	private readonly allCollections =
		inject(CollectionsStore).collections('gallery');
	protected readonly collections = computed(
		() => this.allCollections() ?? []
	);
	/** The tags already in the chosen collection's public images. */
	protected readonly tagSuggestions = toSignal(
		toObservable(computed(() => this.fields().collection)).pipe(
			switchMap((collection) =>
				collection
					? this.galleryProvider
							.fetchCollectionTags(collection)
							.pipe(catchError(() => of([])))
					: of([])
			)
		),
		{ initialValue: [] }
	);

	protected setCollection(collection: string): void {
		this.session().update({ collection });
	}

	protected setCaption(caption: string): void {
		this.session().update({ caption });
	}

	protected setImageUrl(imageUrl: string): void {
		this.session().update({ imageUrl });
	}

	protected setTags(tags: string[]): void {
		this.session().update({ tags });
	}
}
