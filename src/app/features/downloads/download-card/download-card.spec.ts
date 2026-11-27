import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { DownloadCard } from './download-card';

const DOWNLOAD_URL = 'https://example.com/world.zip';

function render(inputs: Partial<DownloadCard> = {}): HTMLElement {
	return renderComponent(DownloadCard, {
		src: DOWNLOAD_URL,
		...inputs
	}).nativeElement;
}

describe('DownloadCard', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [DownloadCard] });
	});

	it('shows the title and description when set', () => {
		const element = render({ title: 'Season 5', desc: 'The full world' });

		expect(element.querySelector('h2')?.textContent).toBe('Season 5');
		expect(element.querySelector('.description')?.textContent).toBe(
			'The full world'
		);
	});

	it('omits the title and description when empty', () => {
		const element = render();

		expect(element.querySelector('h2')).toBeNull();
		expect(element.querySelector('.description')).toBeNull();
	});

	it('shows imgSrc as a decorative background image', () => {
		const image = render({ imgSrc: 'assets/world.png' }).querySelector(
			'img'
		);

		expect(image?.getAttribute('src')).toBe('assets/world.png');
		expect(image?.alt).toBe('');
	});

	it('has no background image when imgSrc is empty', () => {
		expect(render().querySelector('img')).toBeNull();
	});

	it('links the Download button to src in a new tab', () => {
		const link = render().querySelector('a');

		expect(link?.textContent).toContain('Download');
		expect(link?.getAttribute('href')).toBe(DOWNLOAD_URL);
		expect(link?.target).toBe('_blank');
		expect(link?.textContent).toContain('(opens in new tab)');
	});
});
