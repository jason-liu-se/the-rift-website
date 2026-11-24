import { Component, computed, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { EDITOR_TYPES } from '../../editor-types';

/**
 * "New <noun>", opening the editor modal; for types that take many at once, a
 * split button whose menu also offers bulk creation.
 */
@Component({
	selector: 'app-create-button',
	templateUrl: './create-button.component.html',
	styleUrl: './create-button.component.scss',
	imports: [
		MatButton,
		MatIcon,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		RouterLink
	]
})
export class CreateButtonComponent {
	public readonly type = input.required<EditorContentType>();

	protected readonly config = computed(() => EDITOR_TYPES[this.type()]);
}
