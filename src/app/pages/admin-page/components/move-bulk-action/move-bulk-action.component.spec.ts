import { TestBed } from '@angular/core/testing';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { MoveBulkActionComponent } from './move-bulk-action.component';

describe('MoveBulkActionComponent', () => {
	it('moves to the chosen collection, once one is chosen', () => {
		TestBed.configureTestingModule({ imports: [MoveBulkActionComponent] });
		const fixture = TestBed.createComponent(MoveBulkActionComponent);
		fixture.componentRef.setInput(
			'collections',
			EDITOR_GALLERY_COLLECTIONS
		);
		const moves: unknown[] = [];
		fixture.componentInstance.runAction.subscribe((move) =>
			moves.push(move)
		);
		fixture.detectChanges();
		const button: HTMLButtonElement =
			fixture.nativeElement.querySelector('button');
		expect(button.disabled).toBe(true);

		fixture.componentInstance['targetCollection'].set('season6');
		fixture.detectChanges();
		button.click();

		expect(moves).toEqual([{ action: 'move', collection: 'season6' }]);
	});
});
