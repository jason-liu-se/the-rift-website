import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import {
	MAX_DOWNLOAD_DESCRIPTION_LENGTH,
	MAX_DOWNLOAD_TITLE_LENGTH,
	MAX_URL_LENGTH
} from 'src/app/core/config/content-limits';
import { DraftSession } from '../../drafts/draft-session';
import { CollectionsStore } from '../../collections-store.service';
import { isNearLimit } from '../../near-limit';
import { ImageFieldComponent } from '../../image-field/image-field.component';

/**
 * A download's fields: collection, title, description, download link, and
 * image. Its position comes from dragging it in the list.
 */
@Component({
	selector: 'app-downloads-form',
	templateUrl: './downloads-form.component.html',
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
		MatSelect
	]
})
export class DownloadsFormComponent {
	public readonly session = input.required<DraftSession<'downloads'>>();

	protected readonly maxTitleLength = MAX_DOWNLOAD_TITLE_LENGTH;
	protected readonly maxDescLength = MAX_DOWNLOAD_DESCRIPTION_LENGTH;
	protected readonly maxUrlLength = MAX_URL_LENGTH;
	protected readonly isNearLimit = isNearLimit;
	protected readonly fields = computed(() => this.session().fields());
	private readonly allCollections =
		inject(CollectionsStore).collections('downloads');
	protected readonly collections = computed(
		() => this.allCollections() ?? []
	);

	protected update(
		changes: Parameters<DraftSession<'downloads'>['update']>[0]
	): void {
		this.session().update(changes);
	}
}
