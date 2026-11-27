import { StatusBadge } from '../../../status-badge/status-badge';
import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { CollectionCardContent } from '../../collection-cards';

/**
 * One collection in the Collections modal's list: its title, details, and
 * status, opening on a click anywhere; and buttons to show or hide it and
 * to delete it.
 */
@Component({
	// A list's items must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'li[app-collection-card]',
	templateUrl: './collection-card.html',
	styleUrl: './collection-card.scss',
	imports: [StatusBadge, MatIcon, MatIconButton, MatTooltip],
	host: {
		'[class.hidden-collection]': '!card().isVisible',
		'[class.editing]': 'card().isOpen'
	}
})
export class CollectionCard {
	public readonly card = input.required<CollectionCardContent>();
	public readonly opened = output<void>();
	public readonly visibilityToggled = output<void>();
	public readonly deleted = output<void>();
}
