import { Component, input } from '@angular/core';

/** Plain text in a list's column. */
@Component({
	selector: 'app-text-cell',
	templateUrl: './text-cell.html',
	styleUrl: './text-cell.scss'
})
export class TextCell {
	public readonly text = input.required<string>();
}
