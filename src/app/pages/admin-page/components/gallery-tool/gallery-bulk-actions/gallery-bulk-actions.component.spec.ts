import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { BulkActionOf } from 'src/app/services/editor-content/editor-content-types';
import { GalleryBulkActionsComponent } from './gallery-bulk-actions.component';

describe('GalleryBulkActionsComponent', () => {
	let fixture: ComponentFixture<GalleryBulkActionsComponent>;
	let actions: BulkActionOf<'gallery'>[];
	const button = (name: string) =>
		[...fixture.nativeElement.querySelectorAll('button')].find(
			(candidate: HTMLButtonElement) =>
				candidate.textContent?.trim() === name
		) as HTMLButtonElement;

	beforeEach(() => {
		actions = [];
		TestBed.configureTestingModule({
			imports: [GalleryBulkActionsComponent]
		});
		fixture = TestBed.createComponent(GalleryBulkActionsComponent);
		fixture.componentRef.setInput(
			'collections',
			EDITOR_GALLERY_COLLECTIONS
		);
		fixture.componentInstance.runAction.subscribe((action) =>
			actions.push(action)
		);
		fixture.detectChanges();
	});

	it('moves to the chosen collection', () => {
		expect(button('Move').disabled).toBe(true);
		fixture.componentInstance['targetCollection'].set('season6');
		fixture.detectChanges();

		button('Move').click();

		expect(actions).toEqual([{ action: 'move', collection: 'season6' }]);
	});

	it('adds and removes the chosen tags', () => {
		fixture.componentInstance['tags'].set(['night']);
		fixture.detectChanges();
		button('Add tags').click();
		fixture.componentInstance['tags'].set(['spawn']);
		fixture.detectChanges();
		button('Remove tags').click();

		expect(actions).toEqual([
			{ action: 'add-tags', tags: ['night'] },
			{ action: 'remove-tags', tags: ['spawn'] }
		]);
	});
});
