import { LiveAnnouncer } from '@angular/cdk/a11y';
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
import {
	MAX_MAP_DIMENSION_NAME_LENGTH,
	MAX_MAP_DIMENSIONS,
	MAX_MAP_WORLD_FIELD_LENGTH
} from 'src/app/config/content-limits';
import { DEFAULT_MAP_PERSPECTIVE } from 'src/app/config/maps';
import { MapDimension } from 'src/app/interfaces/api-responses';
import { ImageFieldComponent } from '../../image-field/image-field.component';

/**
 * A season's dimensions, in the order the map page shows them: add, remove,
 * edit, and move up or down (buttons, so it all works by keyboard; focus
 * follows the moved dimension).
 */
@Component({
	selector: 'app-dimensions-editor',
	templateUrl: './dimensions-editor.component.html',
	styleUrl: './dimensions-editor.component.scss',
	imports: [
		FormsModule,
		ImageFieldComponent,
		MatButton,
		MatIcon,
		MatIconButton,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel
	]
})
export class DimensionsEditorComponent {
	private announcer = inject(LiveAnnouncer);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);

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

	protected removeDimension(index: number): void {
		const name = this.nameOf(index);
		this.dimensionsChange.emit(
			this.dimensions().filter((_, i) => i !== index)
		);
		this.announcer.announce(`Removed ${name}.`);
		this.focusAfterRender(Math.max(0, index - 1), '.add-dimension');
	}

	protected moveDimension(index: number, offset: -1 | 1): void {
		const target = index + offset;
		const reordered = [...this.dimensions()];
		[reordered[index], reordered[target]] = [
			reordered[target],
			reordered[index]
		];
		this.dimensionsChange.emit(reordered);
		this.announcer.announce(
			`Moved ${this.nameOf(index)} to position ${target + 1} of ${reordered.length}.`
		);
		const button = offset === -1 ? '.move-up' : '.move-down';
		const isAtEnd = target === 0 || target === reordered.length - 1;
		// At either end its button is disabled, so focus its other one.
		this.focusAfterRender(
			target,
			isAtEnd ? (offset === -1 ? '.move-down' : '.move-up') : button
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
