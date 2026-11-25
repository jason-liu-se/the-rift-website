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
			[...fixture.nativeElement.querySelectorAll('button')].find(
				(candidate: HTMLButtonElement) =>
					candidate.textContent?.trim() === name
			) as HTMLButtonElement;

		fixture.componentInstance['tags'].set(['night']);
		fixture.detectChanges();
		button('Add tags').click();
		fixture.componentInstance['tags'].set(['spawn']);
		fixture.detectChanges();
		button('Remove tags').click();

		expect(host.actions).toEqual([
			{ action: 'add-tags', tags: ['night'] },
			{ action: 'remove-tags', tags: ['spawn'] }
		]);
	});
});
