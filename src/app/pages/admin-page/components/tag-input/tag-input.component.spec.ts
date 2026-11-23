import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagInputComponent } from './tag-input.component';

describe('TagInputComponent', () => {
	let fixture: ComponentFixture<TagInputComponent>;
	let input: HTMLInputElement;

	function addByTyping(text: string) {
		input.value = text;
		input.dispatchEvent(new Event('input'));
		input.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				keyCode: 13,
				bubbles: true
			})
		);
		fixture.detectChanges();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [TagInputComponent] });
		fixture = TestBed.createComponent(TagInputComponent);
		fixture.componentRef.setInput('maxTags', 3);
		fixture.detectChanges();
		input = fixture.nativeElement.querySelector('input');
	});

	it('adds typed tags normalised, once each', () => {
		addByTyping('  Night ');
		addByTyping('night');
		addByTyping('Spawn');

		expect(fixture.componentInstance.tags()).toEqual(['night', 'spawn']);
	});

	it('removes a tag with its remove button', () => {
		fixture.componentInstance.tags.set(['night', 'spawn']);
		fixture.detectChanges();

		fixture.nativeElement
			.querySelector('button[aria-label="Remove tag night"]')
			.click();

		expect(fixture.componentInstance.tags()).toEqual(['spawn']);
	});

	it('stops at the most tags', () => {
		for (const tag of ['a', 'b', 'c', 'd']) {
			addByTyping(tag);
		}

		expect(fixture.componentInstance.tags()).toEqual(['a', 'b', 'c']);
		expect(input.disabled).toBe(true);
	});
});
