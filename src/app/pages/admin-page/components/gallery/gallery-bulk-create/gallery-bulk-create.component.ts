import {
	CdkDrag,
	CdkDragHandle,
	CdkDropList,
	moveItemInArray
} from '@angular/cdk/drag-drop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
	Component,
	DestroyRef,
	ElementRef,
	Injector,
	afterNextRender,
	computed,
	inject,
	output,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import {
	EMPTY,
	Observable,
	catchError,
	concat,
	concatMap,
	defer,
	filter,
	finalize,
	from,
	map,
	of,
	tap
} from 'rxjs';
import { MAX_BULK_ITEMS } from 'src/app/config/admin';
import { MAX_GALLERY_CAPTION_LENGTH } from 'src/app/config/content-limits';
import { MAX_UPLOAD_FILES, UPLOAD_IMAGE_TYPES } from 'src/app/config/uploads';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { ImageUploadService } from 'src/app/services/image-upload/image-upload.service';
import { findImageFileProblem } from 'src/app/utilities/image-files';
import { isAllowedImageUrl } from 'src/app/utilities/image-urls';
import { describeWriteError } from '../../../utilities/write-errors';
import {
	BulkSummary,
	summarizeBulkResults,
	toChunks
} from '../../editor-list/bulk-results';
import { ModalShellComponent } from '../../modal-shell/modal-shell.component';
import { TagInputComponent } from '../../tag-input/tag-input.component';
import {
	BulkImageRow,
	captionFromFileName,
	findRowProblem,
	parsePastedLinks,
	toCreateRequest
} from './bulk-image-rows';
import { CollectionsStore } from '../../../services/collections-store.service';

const IMAGES = { one: 'image', many: 'images' };
const NOT_ALLOWED_LINK = "This link isn't from imgbb or imgur.";

/**
 * Adds many gallery images at once: drop, paste, or choose files (or add
 * links), apply a collection, tags, and visibility to all, adjust and order
 * each row, then upload and publish with one button. Done rows leave; failed
 * rows stay, marked, to retry.
 */
@Component({
	selector: 'app-gallery-bulk-create',
	templateUrl: './gallery-bulk-create.component.html',
	styleUrl: './gallery-bulk-create.component.scss',
	imports: [
		CdkDrag,
		CdkDragHandle,
		CdkDropList,
		FormsModule,
		MatButton,
		MatCheckbox,
		MatFormField,
		MatIcon,
		MatIconButton,
		MatInput,
		MatLabel,
		MatOption,
		MatSelect,
		MatTooltip,
		ModalShellComponent,
		TagInputComponent
	],
	host: { '(paste)': 'addPasted($event)' }
})
export class GalleryBulkCreateComponent {
	private uploads = inject(ImageUploadService);
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);
	private apiStatus = inject(ApiStatusService).status;
	private announcer = inject(LiveAnnouncer);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);

	/** Done: back to the list (after publishing anything, it reloads). */
	public readonly closed = output<void>();

	protected readonly acceptedTypes = UPLOAD_IMAGE_TYPES.join(',');
	protected readonly maxCaptionLength = MAX_GALLERY_CAPTION_LENGTH;
	private readonly allCollections =
		inject(CollectionsStore).collections('gallery');
	protected readonly collections = computed(
		() => this.allCollections() ?? []
	);
	protected readonly rows = signal<BulkImageRow[]>([]);
	/** Rows not yet published (published ones leave the list). */
	public readonly rowCount = computed(() => this.rows().length);
	protected readonly pastedLinks = signal('');
	/** "Set all": also the defaults for rows added later. */
	protected readonly allCollection = signal('');
	protected readonly allTags = signal<string[]>([]);
	protected readonly isAllVisible = signal(true);
	protected readonly isPublishing = signal(false);
	protected readonly isDragging = signal(false);
	protected readonly canUpload = computed(() => this.apiStatus() === 'up');
	/** "3 images · 1 needs a caption": what's left before publishing. */
	protected readonly summary = computed(() => {
		const rows = this.rows();
		if (rows.length === 0) {
			return 'No images yet.';
		}
		const missing = (field: 'caption' | 'collection') =>
			rows.filter((row) => !row[field].trim()).length;
		const needs = (count: number, what: string) =>
			count === 0
				? []
				: [`${count} ${count === 1 ? 'needs' : 'need'} ${what}`];
		return [
			`${rows.length} ${rows.length === 1 ? IMAGES.one : IMAGES.many}`,
			...needs(missing('caption'), 'a caption'),
			...needs(missing('collection'), 'a collection')
		].join(' · ');
	});
	protected readonly publishLabel = computed(() => {
		const count = this.rows().length;
		return `Upload and publish ${count} ${count === 1 ? IMAGES.one : IMAGES.many}`;
	});

	constructor() {
		inject(DestroyRef).onDestroy(() =>
			this.rows().forEach(
				(row) => row.file && URL.revokeObjectURL(row.previewUrl)
			)
		);
	}

	protected addChosenFiles(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		this.addFiles(files);
	}

	protected allowDrop(event: DragEvent): void {
		if (this.canUpload() && event.dataTransfer?.types.includes('Files')) {
			event.preventDefault();
			this.isDragging.set(true);
		}
	}

	protected addDropped(event: DragEvent): void {
		this.isDragging.set(false);
		if (this.canUpload() && event.dataTransfer?.files.length) {
			event.preventDefault();
			this.addFiles([...event.dataTransfer.files]);
		}
	}

	/** Pasted image files become rows; pasted text goes where it's typed. */
	protected addPasted(event: ClipboardEvent): void {
		const files = [...(event.clipboardData?.files ?? [])];
		if (this.canUpload() && files.length > 0) {
			event.preventDefault();
			this.addFiles(files);
		}
	}

	/** Moves a row; from its Move buttons, focus follows it. */
	protected moveRow(fromIndex: number, toIndex: number): void {
		if (fromIndex === toIndex) {
			return;
		}
		const wasButton = !!(
			document.activeElement as HTMLElement | null
		)?.closest('.row-actions');
		this.rows.update((rows) => {
			const reordered = [...rows];
			moveItemInArray(reordered, fromIndex, toIndex);
			return reordered;
		});
		this.announcer.announce(
			`Moved image ${fromIndex + 1} to position ${toIndex + 1} of ${this.rows().length}.`
		);
		if (!wasButton) {
			return;
		}
		const isUp = toIndex < fromIndex;
		afterNextRender(
			() => {
				const row =
					this.host.nativeElement.querySelectorAll('.row')[toIndex];
				const same = row?.querySelector<HTMLButtonElement>(
					isUp ? '.move-up' : '.move-down'
				);
				const other = row?.querySelector<HTMLButtonElement>(
					isUp ? '.move-down' : '.move-up'
				);
				(same && !same.disabled ? same : other)?.focus();
			},
			{ injector: this.injector }
		);
	}

	private addFiles(files: File[]): void {
		this.rows.update((rows) => [
			...rows,
			...files.map((file) => ({
				...this.newRow(URL.createObjectURL(file)),
				file,
				caption: captionFromFileName(file.name),
				problem: findImageFileProblem(file)
			}))
		]);
	}

	protected addLinks(): void {
		const links = parsePastedLinks(this.pastedLinks());
		this.pastedLinks.set('');
		this.rows.update((rows) => [
			...rows,
			...links.map((link) => ({
				...this.newRow(link),
				imageUrl: link,
				problem: isAllowedImageUrl(link) ? undefined : NOT_ALLOWED_LINK
			}))
		]);
	}

	protected setAll(field: 'collection' | 'tags' | 'visibility'): void {
		this.rows.update((rows) =>
			rows.map((row) => {
				switch (field) {
					case 'collection':
						return { ...row, collection: this.allCollection() };
					case 'tags':
						return { ...row, tags: this.allTags() };
					default:
						return { ...row, isVisible: this.isAllVisible() };
				}
			})
		);
	}

	protected updateRow(id: string, changes: Partial<BulkImageRow>): void {
		this.rows.update((rows) =>
			rows.map((row) =>
				row.id === id ? { ...row, ...changes, problem: undefined } : row
			)
		);
	}

	protected removeRow(id: string): void {
		const row = this.rows().find((candidate) => candidate.id === id);
		if (row?.file) {
			URL.revokeObjectURL(row.previewUrl);
		}
		this.rows.update((rows) =>
			rows.filter((candidate) => candidate.id !== id)
		);
	}

	/** Uploads every file not yet uploaded, then creates every ready row. */
	protected uploadAndPublish(): void {
		this.markRowProblems();
		this.isPublishing.set(true);
		concat(
			this.uploadFiles(),
			defer(() => this.createRows())
		)
			.pipe(finalize(() => this.isPublishing.set(false)))
			.subscribe((summary) => this.notifier.notify(summary));
	}

	private newRow(previewUrl: string): BulkImageRow {
		return {
			id: crypto.randomUUID(),
			previewUrl,
			caption: '',
			collection: this.allCollection(),
			tags: this.allTags(),
			isVisible: this.isAllVisible()
		};
	}

	private markRowProblems(): void {
		this.rows.update((rows) =>
			rows.map((row) => ({
				...row,
				problem:
					(row.file &&
						!row.imageUrl &&
						findImageFileProblem(row.file)) ||
					findRowProblem(row)
			}))
		);
	}

	private isReady(row: BulkImageRow): boolean {
		return !row.problem;
	}

	/**
	 * Uploads the ready rows' files, by collection (each its own album), at
	 * most MAX_UPLOAD_FILES a request. Summarises only failed requests.
	 */
	private uploadFiles(): Observable<BulkSummary> {
		const pending = this.rows().filter(
			(row) => row.file && !row.imageUrl && this.isReady(row)
		);
		const collections = [...new Set(pending.map((row) => row.collection))];
		const batches = collections.flatMap((collection) =>
			toChunks(
				pending.filter((row) => row.collection === collection),
				MAX_UPLOAD_FILES
			).map((chunk) => ({ collection, chunk }))
		);
		return from(batches).pipe(
			concatMap(({ collection, chunk }) =>
				this.uploads
					.uploadImages(
						chunk.map((row) => row.file!),
						{ album: 'gallery', collection }
					)
					.pipe(
						filter((event) => event.type === 'done'),
						concatMap((event) => {
							event.response.results.forEach((result, index) => {
								const { id } = chunk[index];
								if ('url' in result) {
									this.updateRow(id, {
										imageUrl: result.url
									});
								} else {
									this.markProblem(
										id,
										`Upload failed: ${result.error}`
									);
								}
							});
							return EMPTY;
						}),
						catchError((error: unknown) => {
							chunk.forEach((row) =>
								this.markProblem(row.id, 'Upload failed.')
							);
							return of({
								message: `Couldn't upload ${chunk.length} images. ${describeWriteError(error)}`,
								hasFailures: true
							});
						})
					)
			)
		);
	}

	/** Creates the ready, uploaded rows, MAX_BULK_ITEMS a request. */
	private createRows(): Observable<BulkSummary> {
		const ready = this.rows().filter(
			(row) => row.imageUrl !== undefined && this.isReady(row)
		);
		return from(toChunks(ready, MAX_BULK_ITEMS)).pipe(
			concatMap((chunk) =>
				this.editorContent
					.bulkCreateGalleryImages({
						items: chunk.map(toCreateRequest)
					})
					.pipe(
						tap(({ results }) => {
							const done = new Set(
								results
									.filter(({ outcome }) => outcome === 'ok')
									.map(({ id }) => id)
							);
							for (const result of results) {
								if (result.outcome === 'invalid') {
									this.markProblem(result.id, result.reason);
								} else if (result.outcome !== 'ok') {
									this.markProblem(
										result.id,
										'Not published; try again.'
									);
								}
							}
							done.forEach((id) => this.removeRow(id));
						}),
						map(({ results }) =>
							summarizeBulkResults('create', results, IMAGES)
						),
						catchError((error: unknown) => {
							chunk.forEach((row) =>
								this.markProblem(
									row.id,
									'Not published; try again.'
								)
							);
							return of({
								message: describeWriteError(error),
								hasFailures: true
							});
						})
					)
			)
		);
	}

	private markProblem(id: string, problem: string): void {
		this.rows.update((rows) =>
			rows.map((row) => (row.id === id ? { ...row, problem } : row))
		);
	}
}
