import {
	Component,
	booleanAttribute,
	ElementRef,
	computed,
	inject,
	input,
	model,
	signal,
	viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MAX_URL_LENGTH } from 'src/app/core/config/content-limits';
import { UPLOAD_IMAGE_TYPES } from 'src/app/core/config/uploads';
import { ImageUploadForm } from 'src/app/core/api/api-requests';
import { ApiStatusMonitor } from 'src/app/core/api/api-status/api-status-monitor';
import { ImageUploader } from 'src/app/features/admin/image-upload/image-uploader';
import { findImageFileProblem } from 'src/app/features/admin/image-upload/image-files';
import { isAllowedImageUrl } from 'src/app/shared/utils/image-urls';
import { describeWriteError } from '../write-errors';

/** Where an upload is: none, sending (0 to 1), or failed (to retry). */
type UploadState =
	| { kind: 'idle' }
	| { kind: 'uploading'; fraction: number }
	| { kind: 'failed'; message: string; file?: File };

export const LINK_PROBLEM =
	"That link isn't from imgur or imgbb. Upload the image instead.";

import { FileDrop } from '../image-upload/file-drop';
/**
 * An image for a tool's item: paste a link (checked against the allowlist), or
 * upload, drop, or paste a file, which goes through the API to imgbb, into
 * `album`. The editor's preview shows the image, so this field doesn't. Uploads
 * need the API and an album, so they're off without either.
 */
@Component({
	selector: 'app-image-field',
	templateUrl: './image-field.html',
	styleUrl: './image-field.scss',
	imports: [
		FileDrop,
		FormsModule,
		MatButton,
		MatFormField,
		MatHint,
		MatIcon,
		MatInput,
		MatLabel
	]
})
export class ImageField {
	private uploads = inject(ImageUploader);
	private apiStatus = inject(ApiStatusMonitor);
	private fileInput =
		viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

	public readonly url = model('');
	public readonly label = input('Image');
	public readonly required = input(false, { transform: booleanAttribute });
	/** Where uploads go; without one, uploads are off (`noAlbumHint` says why). */
	public readonly album = input<ImageUploadForm>();
	public readonly noAlbumHint = input('');

	protected readonly maxUrlLength = MAX_URL_LENGTH;
	protected readonly acceptedTypes = UPLOAD_IMAGE_TYPES.join(',');
	protected readonly upload = signal<UploadState>({ kind: 'idle' });
	/** Only a link typed here is checked: a saved one was checked already. */
	private readonly isEdited = signal(false);

	protected readonly isOffline = computed(
		() => this.apiStatus.status() !== 'up'
	);
	protected readonly canUpload = computed(
		() =>
			!this.isOffline() &&
			!!this.album() &&
			this.upload().kind !== 'uploading'
	);
	protected readonly linkProblem = computed(() => {
		const url = this.url().trim();
		return this.isEdited() && url && !isAllowedImageUrl(url)
			? LINK_PROBLEM
			: undefined;
	});

	protected editLink(url: string): void {
		this.isEdited.set(true);
		this.url.set(url);
	}

	protected chooseFile(): void {
		this.fileInput().nativeElement.click();
	}

	protected uploadChosenFile(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) {
			this.uploadFile(file);
		}
	}

	/** A pasted image file uploads; pasted text goes into the link as usual. */
	protected uploadPasted(event: ClipboardEvent): void {
		const file = event.clipboardData?.files[0];
		if (file && this.canUpload()) {
			event.preventDefault();
			this.uploadFile(file);
		}
	}

	protected retryUpload(): void {
		const state = this.upload();
		if (state.kind === 'failed' && state.file) {
			this.uploadFile(state.file);
		}
	}

	protected uploadFile(file: File): void {
		const album = this.album();
		if (!album) {
			return;
		}
		const problem = findImageFileProblem(file);
		if (problem) {
			this.upload.set({ kind: 'failed', message: problem });
			return;
		}
		this.upload.set({ kind: 'uploading', fraction: 0 });
		this.uploads.uploadImages([file], album).subscribe({
			next: (event) => {
				if (event.type === 'progress') {
					this.upload.set({
						kind: 'uploading',
						fraction: event.fraction
					});
					return;
				}
				const [result] = event.response.results;
				if (result && 'url' in result) {
					this.isEdited.set(false);
					this.url.set(result.url);
					this.upload.set({ kind: 'idle' });
				} else {
					this.upload.set({
						kind: 'failed',
						message: `Couldn't upload ${file.name}: ${result?.error ?? 'no result'}.`,
						file
					});
				}
			},
			error: (error: unknown) =>
				this.upload.set({
					kind: 'failed',
					message: `Couldn't upload ${file.name}. ${describeWriteError(error)}`,
					file
				})
		});
	}
}
