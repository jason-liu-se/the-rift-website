import { Component, model } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Whether something shows on the site, as a modal footer's switch: on
 * (coloured) is visible to everyone. Named for what "on" means; the visible
 * text says the state.
 */
@Component({
	selector: 'app-visibility-toggle',
	template: `<mat-slide-toggle
		color="primary"
		aria-label="Visible on the site"
		[matTooltip]="
			visible() ? 'Everyone can see it' : 'Only editors can see it'
		"
		[checked]="visible()"
		(change)="visible.set($event.checked)"
	>
		<span class="state" aria-hidden="true">{{
			visible() ? 'Visible' : 'Hidden'
		}}</span>
	</mat-slide-toggle>`,
	styleUrl: './visibility-toggle.component.scss',
	imports: [MatSlideToggle, MatTooltip]
})
export class VisibilityToggleComponent {
	public readonly visible = model.required<boolean>();
}
