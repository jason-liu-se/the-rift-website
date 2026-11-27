import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagInput } from './tag-input';

describe('TagInput', () => {
	let fixture: ComponentFixture<TagInput>;
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
		TestBed.configureTestingModule({ imports: [TagInput] });
		fixture = TestBed.createComponent(TagInput);
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

	it('removes a tag with its remove button, without opening suggestions', () => {
		fixture.componentRef.setInput('suggestions', [
			'night',
			'spawn',
			'base'
		]);
		fixture.componentInstance.tags.set(['night', 'spawn']);
		fixture.detectChanges();

		fixture.nativeElement
			.querySelector('button[aria-label="Remove tag night"]')
			.click();
		fixture.detectChanges();

		expect(fixture.componentInstance.tags()).toEqual(['spawn']);
		expect(document.activeElement).toBe(input);
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('stops at the most tags', () => {
		for (const tag of ['a', 'b', 'c', 'd']) {
			addByTyping(tag);
		}

		expect(fixture.componentInstance.tags()).toEqual(['a', 'b', 'c']);
		expect(input.disabled).toBe(true);
	});
});
