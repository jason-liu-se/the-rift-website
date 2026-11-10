import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { SectionCardComponent } from './section-card.component';

const TITLE = 'About us';
const CONTENT = 'We are a Minecraft community.';

function render(inputs: Partial<SectionCardComponent> = {}): HTMLElement {
	return renderComponent(SectionCardComponent, inputs).nativeElement;
}

describe('SectionCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [SectionCardComponent] });
	});

	describe('text', () => {
		it('shows the title and content with a break between them', () => {
			const element = render({ title: TITLE, content: CONTENT });

			expect(element.querySelector('h2')?.textContent?.trim()).toBe(
				TITLE
			);
			expect(element.querySelector('.content')?.textContent?.trim()).toBe(
				CONTENT
			);
			expect(element.querySelector('.section-break')).not.toBeNull();
		});

		it('shows only the title, without a break, when content is empty', () => {
			const element = render({ title: TITLE });

			expect(element.querySelector('h2')).not.toBeNull();
			expect(element.querySelector('.content')).toBeNull();
			expect(element.querySelector('.section-break')).toBeNull();
		});

		it('shows only the content, without a break, when title is empty', () => {
			const element = render({ content: CONTENT });

			expect(element.querySelector('h2')).toBeNull();
			expect(element.querySelector('.content')).not.toBeNull();
			expect(element.querySelector('.section-break')).toBeNull();
		});

		it('omits the text container when title and content are empty', () => {
			expect(render().querySelector('.main-container')).toBeNull();
		});
	});

	describe('image', () => {
		it('shows the image with its alt text when img is set', () => {
			const image = render({
				img: 'assets/castle.png',
				imgAlt: 'A castle'
			}).querySelector('img');

			expect(image?.getAttribute('src')).toBe('assets/castle.png');
			expect(image?.alt).toBe('A castle');
		});

		it('omits the image when img is empty', () => {
			expect(render().querySelector('img')).toBeNull();
		});
	});

	it.each([
		{ titlePosition: undefined, expectedClass: 'left-align' },
		{ titlePosition: 'right', expectedClass: 'right-align' },
		{ titlePosition: 'center', expectedClass: 'center-align' }
	])(
		'aligns the title with "$expectedClass" when titlePosition is $titlePosition',
		({ titlePosition, expectedClass }) => {
			const title = render({ title: TITLE, titlePosition }).querySelector(
				'h2'
			);

			expect(title?.classList).toContain(expectedClass);
		}
	);

	it.each([
		{ contentPosition: undefined, expectedClass: 'left-align' },
		{ contentPosition: 'right', expectedClass: 'right-align' },
		{ contentPosition: 'center', expectedClass: 'center-align' }
	])(
		'aligns the content with "$expectedClass" when contentPosition is $contentPosition',
		({ contentPosition, expectedClass }) => {
			const element = render({ content: CONTENT, contentPosition });

			expect(element.querySelector('.content')?.classList).toContain(
				expectedClass
			);
			expect(
				element.querySelector('.dynamic-content')?.classList
			).toContain(expectedClass);
		}
	);

	it.each([
		{ backgroundType: undefined, expectedClass: 'light-background' },
		{ backgroundType: 'dark', expectedClass: 'dark-background' },
		{ backgroundType: 'none', expectedClass: 'empty-background' }
	])(
		'uses "$expectedClass" when backgroundType is $backgroundType',
		({ backgroundType, expectedClass }) => {
			const wrapper = render({ backgroundType }).querySelector(
				'.section-card-wrapper'
			);

			expect(wrapper?.classList).toContain(expectedClass);
		}
	);

	it.each([
		{ imgPos: undefined, expectedClass: 'left-align-image' },
		{ imgPos: 'right', expectedClass: 'right-align-image' },
		{ imgPos: 'top', expectedClass: 'top-align-image' },
		{ imgPos: 'bottom', expectedClass: 'bottom-align-image' }
	])(
		'positions the image with "$expectedClass" when imgPos is $imgPos',
		({ imgPos, expectedClass }) => {
			const containers = render({ imgPos }).querySelector('.containers');

			expect(containers?.classList).toContain(expectedClass);
		}
	);

	describe('padding', () => {
		it('pads both axes by default', () => {
			const card = render().querySelector('.section-card');

			expect(card?.classList).toContain('padding-x');
			expect(card?.classList).toContain('padding-y');
		});

		it('removes only horizontal padding when paddingX is false', () => {
			const card = render({ paddingX: false }).querySelector(
				'.section-card'
			);

			expect(card?.classList).not.toContain('padding-x');
			expect(card?.classList).toContain('padding-y');
		});

		it('removes only vertical padding when paddingY is false', () => {
			const card = render({ paddingY: false }).querySelector(
				'.section-card'
			);

			expect(card?.classList).toContain('padding-x');
			expect(card?.classList).not.toContain('padding-y');
		});
	});
});
