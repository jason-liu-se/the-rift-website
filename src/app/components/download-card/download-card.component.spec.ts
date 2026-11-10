import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { DownloadCardComponent } from './download-card.component';

const DOWNLOAD_URL = 'https://example.com/world.zip';

function render(inputs: Partial<DownloadCardComponent> = {}): HTMLElement {
	return renderComponent(DownloadCardComponent, {
		src: DOWNLOAD_URL,
		...inputs
	}).nativeElement;
}

describe('DownloadCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [DownloadCardComponent] });
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

	it('uses imgSrc as the background image', () => {
		const card = render({
			imgSrc: 'assets/world.png'
		}).querySelector<HTMLElement>('.download-card');

		expect(card?.style.backgroundImage).toContain('assets/world.png');
	});

	it('has no background image when imgSrc is empty', () => {
		const card = render().querySelector<HTMLElement>('.download-card');

		expect(card?.getAttribute('style')).toBeNull();
	});

	it('links the Download button to src in a new tab', () => {
		const link = render().querySelector('a');

		expect(link?.textContent).toContain('Download');
		expect(link?.getAttribute('href')).toBe(DOWNLOAD_URL);
		expect(link?.target).toBe('_blank');
	});
});
