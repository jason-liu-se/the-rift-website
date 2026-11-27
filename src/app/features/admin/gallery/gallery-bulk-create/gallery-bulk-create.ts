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
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { MAX_GALLERY_CAPTION_LENGTH } from 'src/app/core/config/content-limits';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { ApiStatusMonitor } from 'src/app/core/api/api-status/api-status-monitor';
import { findImageFileProblem } from 'src/app/features/admin/image-upload/image-files';
import { isAllowedImageUrl } from 'src/app/shared/utils/image-urls';
import { CollectionSelect } from '../../collection-select/collection-select';
import { ModalShell } from '../../modal-shell/modal-shell';
import { TagInput } from '../../tag-input/tag-input';
import { BulkImageIntake } from './bulk-image-intake/bulk-image-intake';
import { GalleryBulkPublisher } from './gallery-bulk-publisher';
import {
	BulkImageRow,
	IMAGE_NOUN,
	captionFromFileName,
	findRowProblem
} from './bulk-image-rows';
import { VisibilityToggle } from '../../visibility-toggle/visibility-toggle';

const NOT_ALLOWED_LINK = "This link isn't from imgbb or imgur.";

/**
 * Adds many gallery images at once: drop, paste, or choose files (or add
 * links), apply a collection, tags, and visibility to all, adjust and order
 * each row, then upload and publish with one button. Done rows leave; failed
 * rows stay, marked, to retry.
 */
@Component({
	selector: 'app-gallery-bulk-create',
	templateUrl: './gallery-bulk-create.html',
	styleUrl: './gallery-bulk-create.scss',
	imports: [
		BulkImageIntake,
		CollectionSelect,
		CdkDrag,
		CdkDragHandle,
		CdkDropList,
		FormsModule,
		MatButton,
		MatFormField,
		MatIcon,
		MatIconButton,
		MatInput,
		MatLabel,
		MatTooltip,
		ModalShell,
		TagInput,
		VisibilityToggle
	],
	host: { '(paste)': 'addPasted($event)' }
})
export class GalleryBulkCreate {
	private publisher = inject(GalleryBulkPublisher);
	private notifier = inject(AdminNotifier);
	private apiStatus = inject(ApiStatusMonitor).status;
	private announcer = inject(LiveAnnouncer);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);

	/** Done: back to the list (after publishing anything, it reloads). */
	public readonly closed = output<void>();

	protected readonly maxCaptionLength = MAX_GALLERY_CAPTION_LENGTH;
	protected readonly rows = signal<BulkImageRow[]>([]);
	/** Rows not yet published (published ones leave the list). */
	public readonly rowCount = computed(() => this.rows().length);
	/** "Set all": also the defaults for rows added later. */
	protected readonly allCollection = signal('');
	protected readonly allTags = signal<string[]>([]);
	protected readonly isAllVisible = signal(true);
	protected readonly isPublishing = signal(false);
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
			`${rows.length} ${rows.length === 1 ? IMAGE_NOUN.one : IMAGE_NOUN.many}`,
			...needs(missing('caption'), 'a caption'),
			...needs(missing('collection'), 'a collection')
		].join(' · ');
	});
	protected readonly publishLabel = computed(() => {
		const count = this.rows().length;
		return `Upload and publish ${count} ${count === 1 ? IMAGE_NOUN.one : IMAGE_NOUN.many}`;
	});

	constructor() {
		inject(DestroyRef).onDestroy(() =>
			this.rows().forEach(
				(row) => row.file && URL.revokeObjectURL(row.previewUrl)
			)
		);
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

	protected addFiles(files: File[]): void {
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

	protected addLinks(links: string[]): void {
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
		this.publisher
			.publish(this.rows().filter((row) => !row.problem))
			.pipe(finalize(() => this.isPublishing.set(false)))
			.subscribe((event) => {
				switch (event.kind) {
					case 'uploaded':
						return this.updateRow(event.id, {
							imageUrl: event.imageUrl
						});
					case 'problem':
						return this.markProblem(event.id, event.problem);
					case 'published':
						return this.removeRow(event.id);
					default:
						return this.notifier.notify(event.summary);
				}
			});
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

	private markProblem(id: string, problem: string): void {
		this.rows.update((rows) =>
			rows.map((row) => (row.id === id ? { ...row, problem } : row))
		);
	}
}
