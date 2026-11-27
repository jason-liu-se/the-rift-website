import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { catchError, of } from 'rxjs';
import { MAX_GALLERY_CAPTION_LENGTH } from 'src/app/core/config/content-limits';
import { ImageUploadForm } from 'src/app/core/api/api-requests';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { DraftSession } from '../../../drafts/draft-session';
import { CollectionsStore } from '../../../services/collections-store.service';
import { isNearLimit } from '../../../utilities/near-limit';
import { ImageFieldComponent } from '../../image-field/image-field.component';
import { TagInputComponent } from '../../tag-input/tag-input.component';

/**
 * A gallery image's fields: its collection, image, caption, and tags (with
 * every tag in use as suggestions).
 */
@Component({
	selector: 'app-gallery-form',
	templateUrl: './gallery-form.component.html',
	styles: ':host { display: grid; gap: 16px; }',
	imports: [
		CdkTextareaAutosize,
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
	public readonly session = input.required<DraftSession<'gallery'>>();

	protected readonly maxCaptionLength = MAX_GALLERY_CAPTION_LENGTH;
	protected readonly isNearLimit = isNearLimit;
	protected readonly fields = computed(() => this.session().fields());
	private readonly allCollections =
		inject(CollectionsStore).collections('gallery');
	protected readonly collections = computed(
		() => this.allCollections() ?? []
	);
	/** Uploads go into the collection's album, so they wait for one. */
	protected readonly album = computed((): ImageUploadForm | undefined => {
		const collection = this.fields().collection;
		return collection ? { album: 'gallery', collection } : undefined;
	});
	protected readonly tagSuggestions = toSignal(
		inject(EditorContentService)
			.fetchGalleryTags()
			.pipe(catchError(() => of([]))),
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
