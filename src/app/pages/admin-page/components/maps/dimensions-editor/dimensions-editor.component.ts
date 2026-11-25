import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
	CdkDrag,
	CdkDragHandle,
	CdkDropList,
	moveItemInArray
} from '@angular/cdk/drag-drop';
import {
	Component,
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
	MAX_MAP_DIMENSION_NAME_LENGTH,
	MAX_MAP_DIMENSIONS,
	MAX_MAP_WORLD_FIELD_LENGTH
} from 'src/app/config/content-limits';
import { DEFAULT_MAP_PERSPECTIVE } from 'src/app/config/maps';
import { MapDimension } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ImageFieldComponent } from '../../image-field/image-field.component';
import { parseBlueMapLink } from './bluemap-link';

/**
 * A season's dimensions, in the order the map page shows them, as cards: add,
 * remove (with Undo), edit, and reorder by dragging or with Move up and Move
 * down (focus follows the moved dimension). A pasted BlueMap link fills in
 * the map ID and starting view.
 */
@Component({
	selector: 'app-dimensions-editor',
	templateUrl: './dimensions-editor.component.html',
	styleUrl: './dimensions-editor.component.scss',
	imports: [
		CdkDrag,
		CdkDragHandle,
		CdkDropList,
		FormsModule,
		ImageFieldComponent,
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
export class DimensionsEditorComponent {
	private announcer = inject(LiveAnnouncer);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private notifier = inject(AdminNotifierService);

	public readonly dimensions = input.required<readonly MapDimension[]>();
	public readonly dimensionsChange = output<MapDimension[]>();

	protected readonly maxDimensions = MAX_MAP_DIMENSIONS;
	protected readonly maxNameLength = MAX_MAP_DIMENSION_NAME_LENGTH;
	protected readonly maxWorldFieldLength = MAX_MAP_WORLD_FIELD_LENGTH;

	protected updateDimension(
		index: number,
		changes: Partial<MapDimension>
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
		this.dimensionsChange.emit([
			...this.dimensions(),
			{
				name: '',
				worldId: '',
				imageUrl: '',
				perspective: DEFAULT_MAP_PERSPECTIVE
			}
		]);
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
			dimensions.splice(index, 0, removed);
			this.dimensionsChange.emit(dimensions);
			this.focusAfterRender(index, 'input');
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
