import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
	MAX_DOWNLOAD_DESCRIPTION_LENGTH,
	MAX_DOWNLOAD_TITLE_LENGTH,
	MAX_URL_LENGTH
} from 'src/app/core/config/content-limits';
import { CollectionSelect } from '../../collection-select/collection-select';
import { DRAFT_FIELDS } from '../../editor-content/editor-content-types';
import { DraftSession } from '../../drafts/draft-session';
import { isNearLimit } from '../../near-limit';
import { ImageField } from '../../image-field/image-field';

/**
 * A download's fields: collection, title, description, download link, and
 * image. Its position comes from dragging it in the list.
 */
@Component({
	selector: 'app-downloads-form',
	templateUrl: './downloads-form.html',
	styles: ':host { display: grid; gap: 16px; }',
	imports: [
		CollectionSelect,
		CdkTextareaAutosize,
		FormsModule,
		ImageField,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel
	]
})
export class DownloadsForm {
	public readonly session = input.required<DraftSession<'downloads'>>();

	protected readonly spec = DRAFT_FIELDS.downloads;
	protected readonly maxTitleLength = MAX_DOWNLOAD_TITLE_LENGTH;
	protected readonly maxDescLength = MAX_DOWNLOAD_DESCRIPTION_LENGTH;
	protected readonly maxUrlLength = MAX_URL_LENGTH;
	protected readonly isNearLimit = isNearLimit;
	protected readonly fields = computed(() => this.session().fields());

	protected update(
		changes: Parameters<DraftSession<'downloads'>['update']>[0]
	): void {
		this.session().update(changes);
	}
}
