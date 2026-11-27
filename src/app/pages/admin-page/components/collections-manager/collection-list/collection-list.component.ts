import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CollectionCard } from '../collection-cards';
import { CollectionCardComponent } from './collection-card/collection-card.component';

/** The Collections modal's list: how many, a New button, and the cards. */
@Component({
	selector: 'app-collection-list',
	templateUrl: './collection-list.component.html',
	styleUrl: './collection-list.component.scss',
	imports: [CollectionCardComponent, MatButton, MatIcon],
	host: { role: 'region', 'aria-labelledby': 'collection-list-heading' }
})
export class CollectionListComponent {
	public readonly cards = input.required<readonly CollectionCard[]>();
	/** The form holds something other than a fresh new collection. */
	public readonly canStartNew = input(false);
	public readonly opened = output<CollectionCard>();
	public readonly visibilityToggled = output<CollectionCard>();
	public readonly deleted = output<CollectionCard>();
	public readonly newStarted = output<void>();
}
