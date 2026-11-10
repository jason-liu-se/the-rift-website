import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryImage } from 'src/app/interfaces/api-responses';
import { renderComponent } from 'src/app/testing/render-component';
import { ImageShowcaseSectionComponent } from './image-showcase-section.component';

const IMAGES: GalleryImage[] = [
	{ url: 'assets/one.png', caption: 'One' },
	{ url: 'assets/two.png', caption: 'Two' }
];

describe('ImageShowcaseSectionComponent', () => {
	let fixture: ComponentFixture<ImageShowcaseSectionComponent>;
	let element: HTMLElement;

	const imageButtons = () =>
		element.querySelectorAll<HTMLButtonElement>('.image-button');
	const popUp = () => element.querySelector('.image-pop-up');

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ImageShowcaseSectionComponent]
		});
		fixture = renderComponent(ImageShowcaseSectionComponent, {
			captionedImages: IMAGES
		});
		element = fixture.nativeElement;
	});

	it('renders a captioned image button for each image', () => {
		expect(imageButtons()).toHaveLength(IMAGES.length);
		imageButtons().forEach((button, i) => {
			expect(button.querySelector('.caption-text')?.textContent).toBe(
				IMAGES[i].caption
			);
		});
	});

	it('hides the pop-up until an image is clicked', () => {
		expect(popUp()).toBeNull();
	});

	it('opens the pop-up on the clicked image', () => {
		imageButtons()[1].click();
		fixture.detectChanges();

		expect(popUp()?.querySelector('.caption')?.textContent).toBe('Two');
	});

	it('closes the pop-up when Close is clicked', () => {
		imageButtons()[0].click();
		fixture.detectChanges();

		expect(popUp()).toBeTruthy();
		popUp()?.querySelector<HTMLButtonElement>('.exit-button')?.click();
		fixture.detectChanges();

		expect(popUp()).toBeNull();
	});
});
