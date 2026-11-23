import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MapDimension } from 'src/app/interfaces/api-responses';
import { DraftSession } from '../../../drafts/draft-session';
import { ImageFieldComponent } from '../../image-field/image-field.component';
import { DimensionsEditorComponent } from '../dimensions-editor/dimensions-editor.component';

/** A map season's fields: its number, image, and dimensions. */
@Component({
	selector: 'app-maps-form',
	templateUrl: './maps-form.component.html',
	styleUrl: './maps-form.component.scss',
	imports: [
		DimensionsEditorComponent,
		FormsModule,
		ImageFieldComponent,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel
	]
})
export class MapsFormComponent {
	public readonly session = input.required<DraftSession<'maps'>>();

	protected readonly fields = computed(() => this.session().fields());

	/** An empty or partial number isn't a season yet. */
	protected setSeason(value: number | string | null): void {
		const season =
			value === '' || value === null ? undefined : Number(value);
		this.session().update({ season });
	}

	protected setImageUrl(imageUrl: string): void {
		this.session().update({ imageUrl });
	}

	protected setDimensions(dimensions: MapDimension[]): void {
		this.session().update({ dimensions });
	}
}
