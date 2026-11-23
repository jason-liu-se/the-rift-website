import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GALLERY_FALLBACK_IMAGE } from 'src/app/config/gallery';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { environment } from 'src/environments/environment';
import { GalleryPageComponent } from './gallery-page.component';

describe('GalleryPageComponent', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	const coverUrl = (collection: string) =>
		`${galleryUrl}/${collection}?startIndex=0&limit=1`;
	const photo = (url: string): GalleryImage => ({
		id: url,
		imageUrl: url,
		caption: '',
		tags: []
	});
	let fixture: ComponentFixture<GalleryPageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;

	const cards = () => [...element.querySelectorAll('.collection-card')];
	const titles = () =>
		cards().map((card) => card.querySelector('.title')?.textContent);
	const descriptions = () =>
		cards().map((card) =>
			card.querySelector('.description')?.textContent?.trim()
		);
	/** Answers GET /gallery; each title is its slug in capitals. */
	const flushCollections = (slugs: string[]) =>
		httpTesting
			.expectOne(galleryUrl)
			.flush(slugs.map((slug) => ({ slug, title: slug.toUpperCase() })));
	const flushCover = (collection: string, total: number, urls: string[]) =>
		httpTesting
			.expectOne(coverUrl(collection))
			.flush({ items: urls.map(photo), total });
	const loadSeasons5And6 = () => {
		flushCollections(['season5', 'season6']);
		flushCover('season5', 12, ['five.webp']);
		flushCover('season6', 7, ['six.webp']);
		fixture.detectChanges();
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [GalleryPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([])
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(GalleryPageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it('shows a card for each collection the API lists, linking to its page', () => {
		loadSeasons5And6();

		expect(titles()).toEqual(['SEASON5', 'SEASON6']);
		expect(
			cards().map((card) => card.querySelector('a')?.getAttribute('href'))
		).toEqual(['/gallery/season5', '/gallery/season6']);
	});

	it("shows each collection's photo count and first photo", () => {
		expect(descriptions()).toEqual([]);

		loadSeasons5And6();

		expect(descriptions()).toEqual(['12 photos', '7 photos']);
		const images = cards().map((card) =>
			card.querySelector('.background-content img')?.getAttribute('src')
		);
		expect(images[0]).toContain('five.webp');
		expect(images[1]).toContain('six.webp');
	});

	it('uses the fallback image for a collection with no photos', () => {
		flushCollections(['season7']);
		flushCover('season7', 0, []);
		fixture.detectChanges();

		expect(
			element
				.querySelector('.background-content img')
				?.getAttribute('src')
		).toContain(GALLERY_FALLBACK_IMAGE);
		expect(descriptions()).toEqual(['0 photos']);
	});

	it('orders seasons by number, so season 10 comes after season 9', () => {
		flushCollections(['season10', 'season9']);
		flushCover('season10', 1, ['ten.webp']);
		flushCover('season9', 1, ['nine.webp']);
		fixture.detectChanges();

		expect(titles()).toEqual(['SEASON9', 'SEASON10']);
	});

	it('says so when there are no collections, but not while loading', () => {
		expect(element.querySelector('.empty-message')).toBeNull();

		flushCollections([]);
		fixture.detectChanges();

		expect(cards()).toEqual([]);
		expect(element.querySelector('.empty-message')?.textContent).toBe(
			'No galleries yet. Check back soon!'
		);
	});

	it('shows an error state when a collection fails, and loads again on Try again', () => {
		flushCollections(['season5', 'season6']);
		httpTesting
			.expectOne(coverUrl('season5'))
			.flush(null, { status: 500, statusText: 'Server Error' });
		httpTesting.expectOne(coverUrl('season6'));
		fixture.detectChanges();

		expect(
			element.querySelector('app-fallback-panel h2')?.textContent
		).toBe("Couldn't load the gallery");
		expect(cards()).toEqual([]);

		element
			.querySelector<HTMLButtonElement>('app-fallback-panel button')!
			.click();
		fixture.detectChanges();
		// The list of collections is reused; only the covers are asked again.
		flushCover('season5', 12, ['five.webp']);
		flushCover('season6', 7, ['six.webp']);
		fixture.detectChanges();

		expect(element.querySelector('app-fallback-panel')).toBeNull();
		expect(descriptions()).toEqual(['12 photos', '7 photos']);
	});
});
