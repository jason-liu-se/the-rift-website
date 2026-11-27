import { Component, input } from '@angular/core';

/** Plain text in a list's column. */
@Component({
	selector: 'app-text-cell',
	templateUrl: './text-cell.component.html',
	styleUrl: './text-cell.component.scss'
})
export class TextCellComponent {
	public readonly text = input.required<string>();
}
