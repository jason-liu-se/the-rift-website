import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CollectionCardContent } from '../collection-cards';
import { CollectionCard } from './collection-card/collection-card';

/** The Collections modal's list: how many, a New button, and the cards. */
@Component({
	selector: 'app-collection-list',
	templateUrl: './collection-list.html',
	styleUrl: './collection-list.scss',
	imports: [CollectionCard, MatButton, MatIcon],
	host: { role: 'region', 'aria-labelledby': 'collection-list-heading' }
})
export class CollectionList {
	public readonly cards = input.required<readonly CollectionCardContent[]>();
	/** The form holds something other than a fresh new collection. */
	public readonly canStartNew = input(false);
	public readonly opened = output<CollectionCardContent>();
	public readonly visibilityToggled = output<CollectionCardContent>();
	public readonly deleted = output<CollectionCardContent>();
	public readonly newStarted = output<void>();
}
