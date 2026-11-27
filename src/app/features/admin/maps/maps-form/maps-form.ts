import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MapDimension } from 'src/app/core/api/api-responses';
import { DRAFT_FIELDS } from '../../editor-content/editor-content-types';
import { DraftSession } from '../../drafts/draft-session';
import {
	DimensionsEditor,
	EditableDimension
} from '../../dimensions-editor/dimensions-editor';

/**
 * A map season's fields: its number and dimensions. The season's own image is
 * optional and unused by the site, so only dimensions get images.
 */
@Component({
	selector: 'app-maps-form',
	templateUrl: './maps-form.html',
	styleUrl: './maps-form.scss',
	imports: [
		DimensionsEditor,
		FormsModule,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel
	]
})
export class MapsForm {
	public readonly session = input.required<DraftSession<'maps'>>();

	protected readonly spec = DRAFT_FIELDS.maps;
	protected readonly fields = computed(() => this.session().fields());

	/** An empty or partial number isn't a season yet. */
	protected setSeason(value: number | string | null): void {
		const season =
			value === '' || value === null ? undefined : Number(value);
		this.session().update({ season });
	}

	/** Its editor keeps the BlueMap fields (`withMapFields`). */
	protected setDimensions(dimensions: EditableDimension[]): void {
		this.session().update({ dimensions: dimensions as MapDimension[] });
	}
}
