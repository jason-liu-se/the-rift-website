import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { catchError, of } from 'rxjs';
import { DownloadCardComponent } from 'src/app/components/download-card/download-card.component';
import {
	MAX_DOWNLOAD_DESCRIPTION_LENGTH,
	MAX_DOWNLOAD_TITLE_LENGTH,
	MAX_URL_LENGTH
} from 'src/app/config/content-limits';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { DraftSession } from '../../../drafts/draft-session';
import { ImageFieldComponent } from '../../image-field/image-field.component';

/**
 * A download's fields: collection, title, description, download link, image,
 * and sort order, with a preview as the downloads page shows it.
 */
@Component({
	selector: 'app-downloads-form',
	templateUrl: './downloads-form.component.html',
	styleUrl: './downloads-form.component.scss',
	imports: [
		DownloadCardComponent,
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
	protected readonly fields = computed(() => this.session().fields());
	protected readonly collections = toSignal(
		inject(EditorContentService)
			.fetchCollections('downloads')
			.pipe(catchError(() => of([]))),
		{ initialValue: [] }
	);

	protected update(
		changes: Parameters<DraftSession<'downloads'>['update']>[0]
	): void {
		this.session().update(changes);
	}

	/** An empty sort order removes it (the item sorts by title). */
	protected setSortOrder(value: number | string | null): void {
		this.update({
			sortOrder: value === '' || value === null ? null : Number(value)
		});
	}
}
