import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';
import { GalleryShowcasePageComponent } from './gallery-showcase-page.component';

describe('GalleryShowcasePageComponent', () => {
	const collectionUrl = `${environment.API_URL}/gallery/season-5`;
	const images: ICaptionCard[] = [{ url: 'image.png', caption: 'Spawn' }];
	let component: GalleryShowcasePageComponent;
	let fixture: ComponentFixture<GalleryShowcasePageComponent>;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [GalleryShowcasePageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations(),
				{
					provide: ActivatedRoute,
					useValue: {
						snapshot: {
							data: { title: 'Season 5', collection: 'season-5' }
						}
					}
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(GalleryShowcasePageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it("loads the route's collection and shows its total without a separate count request", () => {
		httpTesting
			.expectOne(`${collectionUrl}?startIndex=0&limit=30`)
			.flush({ items: images, total: 31 });
		fixture.detectChanges();

		expect(component.captionedImages).toEqual(images);
		expect(component.paginationLength).toBe(31);
		expect(
			fixture.nativeElement.querySelector('.page-caption').textContent
		).toContain('Results: 31');
		httpTesting.expectNone(`${collectionUrl}/count`);
	});
});
