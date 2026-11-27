import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CollectionsStore } from '../../../services/collections-store.service';
import { provideFakeBulkActionHost } from '../../editor-list/bulk-action-host.testing';
import { GalleryBulkActionsComponent } from './gallery-bulk-actions.component';

describe('GalleryBulkActionsComponent', () => {
	it('adds and removes the chosen tags', () => {
		const host = provideFakeBulkActionHost('gallery');
		TestBed.configureTestingModule({
			imports: [GalleryBulkActionsComponent],
			providers: [
				host.provider,
				{
					provide: CollectionsStore,
					useValue: { collections: () => signal([]) }
				}
			]
		});
		const fixture = TestBed.createComponent(GalleryBulkActionsComponent);
		fixture.detectChanges();
		const button = (name: string) =>
			[...document.querySelectorAll('button')].find(
				(candidate) =>
					candidate.textContent
						?.replace(
							candidate.querySelector('mat-icon')?.textContent ??
								'',
							''
						)
						.trim() === name
			)!;
		const changeTags = (tags: string[], action: string) => {
			button('Tags').click();
			fixture.componentInstance['tags'].set(tags);
			fixture.detectChanges();
			button(action).click();
			fixture.detectChanges();
		};

		changeTags(['night'], 'Add tags');
		changeTags(['spawn'], 'Remove tags');

		expect(host.actions).toEqual([
			{ action: 'add-tags', tags: ['night'] },
			{ action: 'remove-tags', tags: ['spawn'] }
		]);
	});
});
