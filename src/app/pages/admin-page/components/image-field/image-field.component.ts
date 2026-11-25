import {
	Component,
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
import { MatInput } from '@angular/material/input';
import { MAX_URL_LENGTH } from 'src/app/config/content-limits';
import { IMAGE_URL_PREFIXES } from 'src/app/config/images';
import { UPLOAD_IMAGE_TYPES } from 'src/app/config/uploads';
import { ImageUploadForm } from 'src/app/interfaces/api-requests';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { ImageUploadService } from 'src/app/services/image-upload/image-upload.service';
import { findImageFileProblem } from 'src/app/utilities/image-files';
import { isAllowedImageUrl } from 'src/app/utilities/image-urls';
import { describeWriteError } from '../../utilities/write-errors';

/** Where an upload is: none, sending (0 to 1), or failed (to retry). */
type UploadState =
	| { kind: 'idle' }
	| { kind: 'uploading'; fraction: number }
	| { kind: 'failed'; message: string; file?: File };

/**
 * An image for a tool's item: paste a link (checked against the allowlist) or
 * upload a file through the API to imgbb, into `album`. Uploads need the API,
 * so they're off while it can't be reached.
 */
@Component({
	selector: 'app-image-field',
	templateUrl: './image-field.component.html',
	styleUrl: './image-field.component.scss',
	imports: [FormsModule, MatButton, MatFormField, MatHint, MatInput, MatLabel]
})
export class ImageFieldComponent {
	private uploads = inject(ImageUploadService);
	private apiStatus = inject(ApiStatusService);
	private fileInput =
		viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

	public readonly url = model('');
	public readonly label = input('Image');
	public readonly album = input.required<ImageUploadForm>();

	protected readonly maxUrlLength = MAX_URL_LENGTH;
	protected readonly acceptedTypes = UPLOAD_IMAGE_TYPES.join(',');
	protected readonly upload = signal<UploadState>({ kind: 'idle' });
	protected readonly canUpload = computed(
		() =>
			this.apiStatus.status() === 'up' &&
			this.upload().kind !== 'uploading'
	);
	protected readonly isOffline = computed(
		() => this.apiStatus.status() !== 'up'
	);
	protected readonly linkProblem = computed(() => {
		const url = this.url().trim();
		return url && !isAllowedImageUrl(url)
			? `Links must start with ${IMAGE_URL_PREFIXES.join(', ')}. Upload the image instead.`
			: undefined;
	});
	protected readonly hasPreview = computed(
		() => !!this.url().trim() && !this.linkProblem()
	);

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

	protected retryUpload(): void {
		const state = this.upload();
		if (state.kind === 'failed' && state.file) {
			this.uploadFile(state.file);
		}
	}

	private uploadFile(file: File): void {
		const problem = findImageFileProblem(file);
		if (problem) {
			this.upload.set({ kind: 'failed', message: problem });
			return;
		}
		this.upload.set({ kind: 'uploading', fraction: 0 });
		this.uploads.uploadImages([file], this.album()).subscribe({
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
