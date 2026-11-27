import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
	CdkDrag,
	CdkDragHandle,
	CdkDropList,
	moveItemInArray
} from '@angular/cdk/drag-drop';
import {
	Component,
	DestroyRef,
	booleanAttribute,
	ElementRef,
	Injector,
	afterNextRender,
	inject,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import {
	MAX_DIMENSION_NAME_LENGTH,
	MAX_DIMENSIONS,
	MAX_MAP_WORLD_FIELD_LENGTH
} from 'src/app/core/config/content-limits';
import { DEFAULT_MAP_PERSPECTIVE } from 'src/app/core/config/maps';
import { ImageUploadForm } from 'src/app/core/api/api-requests';
import { Dimension, MapDimension } from 'src/app/core/api/api-responses';
import { AdminNotifierService } from 'src/app/features/admin/admin-notifier.service';
import { ImageField } from '../image-field/image-field';
import { ItemThumbnail } from '../item-thumbnail/item-thumbnail';
import { parseBlueMapLink } from './bluemap-link';

/** A dimension being edited: a map's also has its BlueMap fields. */
export type EditableDimension = Dimension &
	Partial<Pick<MapDimension, 'worldId' | 'perspective'>>;

/**
 * A map season's or collection's dimensions, in the order the site shows
 * them, as cards: add, remove (with Undo), edit, and reorder by dragging or
 * with Move up and Move down (focus follows the moved dimension). A map's
 * (`withMapFields`) also have a BlueMap map ID and starting view, which a
 * pasted BlueMap link fills in.
 */
@Component({
	selector: 'app-dimensions-editor',
	templateUrl: './dimensions-editor.html',
	styleUrl: './dimensions-editor.scss',
	imports: [
		CdkDrag,
		CdkDragHandle,
		CdkDropList,
		FormsModule,
		ImageField,
		ItemThumbnail,
		MatButton,
		MatIcon,
		MatIconButton,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel,
		MatTooltip
	]
})
export class DimensionsEditor {
	private announcer = inject(LiveAnnouncer);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private notifier = inject(AdminNotifierService);
	/** Undo outlives the editor (its toast stays), so it checks first. */
	private isDestroyed = false;

	public readonly dimensions = input.required<readonly EditableDimension[]>();
	public readonly dimensionsChange = output<EditableDimension[]>();
	public readonly withMapFields = input(false, {
		transform: booleanAttribute
	});
	/** For a form without a preview beside it, which would show the images. */
	public readonly withThumbnails = input(false, {
		transform: booleanAttribute
	});
	/** Where image uploads go; without one, uploads are off. */
	public readonly album = input<ImageUploadForm>();
	public readonly noAlbumHint = input('');

	protected readonly maxDimensions = MAX_DIMENSIONS;
	protected readonly maxNameLength = MAX_DIMENSION_NAME_LENGTH;
	protected readonly maxWorldFieldLength = MAX_MAP_WORLD_FIELD_LENGTH;

	constructor() {
		inject(DestroyRef).onDestroy(() => (this.isDestroyed = true));
	}

	protected updateDimension(
		index: number,
		changes: Partial<EditableDimension>
	): void {
		this.dimensionsChange.emit(
			this.dimensions().map((dimension, i) =>
				i === index ? { ...dimension, ...changes } : dimension
			)
		);
	}

	/** A BlueMap link sets the map ID and view; anything else, just the view. */
	protected setStartingView(index: number, text: string): void {
		this.updateDimension(
			index,
			parseBlueMapLink(text) ?? { perspective: text }
		);
	}

	protected addDimension(): void {
		const dimension: EditableDimension = this.withMapFields()
			? {
					name: '',
					worldId: '',
					imageUrl: '',
					perspective: DEFAULT_MAP_PERSPECTIVE
				}
			: { name: '', imageUrl: '' };
		this.dimensionsChange.emit([...this.dimensions(), dimension]);
		this.focusAfterRender(this.dimensions().length, 'input');
	}

	/** Removes it, with Undo (the toast also tells screen readers). */
	protected removeDimension(index: number): void {
		const name = this.nameOf(index);
		const removed = this.dimensions()[index];
		this.dimensionsChange.emit(
			this.dimensions().filter((_, i) => i !== index)
		);
		this.notifier.notifyWithUndo(`Removed ${name}.`, () => {
			const dimensions = [...this.dimensions()];
			if (this.isDestroyed || dimensions.length >= this.maxDimensions) {
				return;
			}
			const at = Math.min(index, dimensions.length);
			dimensions.splice(at, 0, removed);
			this.dimensionsChange.emit(dimensions);
			this.focusAfterRender(at, 'input');
		});
		this.focusAfterRender(Math.max(0, index - 1), '.add-dimension');
	}

	protected moveDimension(index: number, target: number): void {
		if (index === target) {
			return;
		}
		const name = this.nameOf(index);
		const reordered = [...this.dimensions()];
		moveItemInArray(reordered, index, target);
		this.dimensionsChange.emit(reordered);
		this.announcer.announce(
			`Moved ${name} to position ${target + 1} of ${reordered.length}.`
		);
		const button = target < index ? '.move-up' : '.move-down';
		const isAtEnd = target === 0 || target === reordered.length - 1;
		// At either end its button is disabled, so focus its other one.
		this.focusAfterRender(
			target,
			isAtEnd ? (target < index ? '.move-down' : '.move-up') : button
		);
	}

	protected nameOf(index: number): string {
		return (
			this.dimensions()[index]?.name.trim() || `dimension ${index + 1}`
		);
	}

	/** Focuses `selector` in the dimension at `index` (or the add button). */
	private focusAfterRender(index: number, selector: string): void {
		afterNextRender(
			() => {
				const host = this.host.nativeElement;
				const dimension = host.querySelectorAll('.dimension')[index];
				const target =
					(selector === '.add-dimension'
						? host
						: dimension
					)?.querySelector<HTMLElement>(selector) ??
					host.querySelector<HTMLElement>('.add-dimension');
				target?.focus();
			},
			{ injector: this.injector }
		);
	}
}
