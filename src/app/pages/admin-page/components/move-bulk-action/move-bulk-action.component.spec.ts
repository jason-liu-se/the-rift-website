import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { CollectionsStore } from '../../services/collections-store.service';
import { provideFakeBulkActionHost } from '../editor-list/bulk-action-host.testing';
import { MoveBulkActionComponent } from './move-bulk-action.component';

describe('MoveBulkActionComponent', () => {
	it('moves to the chosen collection, once one is chosen', () => {
		const host = provideFakeBulkActionHost('gallery');
		TestBed.configureTestingModule({
			imports: [MoveBulkActionComponent],
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
		const fixture = TestBed.createComponent(MoveBulkActionComponent);
		fixture.detectChanges();
		const button: HTMLButtonElement =
			fixture.nativeElement.querySelector('button');
		expect(button.disabled).toBe(true);

		fixture.componentInstance['targetCollection'].set('season6');
		fixture.detectChanges();
		button.click();

		expect(host.actions).toEqual([
			{ action: 'move', collection: 'season6' }
		]);
	});
});
