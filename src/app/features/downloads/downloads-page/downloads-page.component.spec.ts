import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DownloadCollection } from 'src/app/core/api/api-responses';
import { environment } from 'src/environments/environment';
import { DownloadsPageComponent } from './downloads-page.component';

const COLLECTIONS: DownloadCollection[] = [
	{
		name: 'worlds',
		title: 'Worlds',
		items: [
			{
				id: '1',
				title: 'Season 5',
				desc: 'Full world',
				downloadUrl: 'https://example.com/season-5.zip',
				imageUrl: 'assets/season-5.png'
			},
			{
				id: '2',
				title: 'Season 4',
				desc: 'Full world',
				downloadUrl: 'https://example.com/season-4.zip',
				imageUrl: 'assets/season-4.png'
			}
		]
	},
	{
		name: 'resource-packs',
		title: 'Resource packs',
		items: [
			{
				id: '3',
				title: 'Rift pack',
				desc: 'Textures',
				downloadUrl: 'https://example.com/pack.zip',
				imageUrl: 'assets/pack.png'
			}
		]
	}
];

describe('DownloadsPageComponent', () => {
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [DownloadsPageComponent],
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('renders a section of download cards for each collection', () => {
		const fixture = TestBed.createComponent(DownloadsPageComponent);
		fixture.detectChanges();

		httpTesting
			.expectOne(`${environment.API_URL}/downloads`)
			.flush(COLLECTIONS);
		fixture.detectChanges();

		const sections: NodeListOf<HTMLElement> =
			fixture.nativeElement.querySelectorAll('app-section-card');
		expect(sections).toHaveLength(COLLECTIONS.length);
		sections.forEach((section, i) => {
			const collection = COLLECTIONS[i];
			const cards = section.querySelectorAll('app-download-card');

			expect(section.querySelector('h2')?.textContent?.trim()).toBe(
				collection.title
			);
			expect(cards).toHaveLength(collection.items.length);
			cards.forEach((card, j) => {
				expect(card.querySelector('h2')?.textContent).toBe(
					collection.items[j].title
				);
				expect(card.querySelector('a')?.getAttribute('href')).toBe(
					collection.items[j].downloadUrl
				);
			});
		});
	});

	it('shows an error state when the request fails, and loads again on Try again', () => {
		const url = `${environment.API_URL}/downloads`;
		const fixture = TestBed.createComponent(DownloadsPageComponent);
		const element: HTMLElement = fixture.nativeElement;
		fixture.detectChanges();

		httpTesting
			.expectOne(url)
			.flush(null, { status: 500, statusText: 'Server Error' });
		fixture.detectChanges();

		expect(
			element.querySelector('app-fallback-panel h2')?.textContent
		).toBe("Couldn't load the downloads");
		expect(element.querySelector('app-section-card')).toBeNull();

		element
			.querySelector<HTMLButtonElement>('app-fallback-panel button')!
			.click();
		fixture.detectChanges();
		httpTesting.expectOne(url).flush(COLLECTIONS);
		fixture.detectChanges();

		expect(element.querySelector('app-fallback-panel')).toBeNull();
		expect(element.querySelectorAll('app-section-card')).toHaveLength(
			COLLECTIONS.length
		);
	});
});
