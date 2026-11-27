import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { CollectionsStore } from '../collections-store';
import { provideFakeBulkActionHost } from '../editor-list/bulk-action-host.testing';
import { MoveBulkAction } from './move-bulk-action';

describe('MoveBulkAction', () => {
	it('moves to the collection picked from its menu', () => {
		const host = provideFakeBulkActionHost('gallery');
		TestBed.configureTestingModule({
			imports: [MoveBulkAction],
			providers: [
				host.provider,
				{
					provide: CollectionsStore,
					useValue: {
						collections: () => signal(EDITOR_GALLERY_COLLECTIONS)
					}
				}
			]
		});
		const fixture = TestBed.createComponent(MoveBulkAction);
		fixture.detectChanges();

		fixture.nativeElement.querySelector('button').click();
		fixture.detectChanges();
		[...document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')]
			.find((item) => item.textContent?.trim() === 'Season 6')!
			.click();

		expect(host.actions).toEqual([
			{ action: 'move', collection: 'season6' }
		]);
	});
});
