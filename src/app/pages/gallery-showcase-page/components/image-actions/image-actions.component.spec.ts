import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ImageActionsComponent } from './image-actions.component';

const IMAGE_URL = 'https://images.example.com/season-5/spawn.webp';
const PNG = new Blob(['png'], { type: 'image/png' });

describe('ImageActionsComponent', () => {
	let announce: ReturnType<typeof vi.fn>;

	function render(imageUrl = IMAGE_URL) {
		const fixture = TestBed.createComponent(ImageActionsComponent);
		fixture.componentRef.setInput('imageUrl', imageUrl);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const [copy, download] = element.querySelectorAll('button');
		const label = (button: HTMLButtonElement) =>
			button.querySelector('.label')?.textContent?.trim();
		/** Lets the click handler's promise finish, then re-renders. */
		const settle = async () => {
			await new Promise((resolve) => setTimeout(resolve));
			fixture.detectChanges();
		};
		return { fixture, copy, download, label, settle };
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ImageActionsComponent],
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		announce = vi
			.spyOn(TestBed.inject(LiveAnnouncer), 'announce')
			.mockResolvedValue() as unknown as ReturnType<typeof vi.fn>;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Copy link', () => {
		it('copies the image URL and confirms it, then resets', () => {
			vi.useFakeTimers();
			const copy = vi
				.spyOn(TestBed.inject(Clipboard), 'copy')
				.mockReturnValue(true);
			const { fixture, copy: button, label } = render();
			expect(button.getAttribute('aria-label')).toBe('Copy link');

			button.click();
			fixture.detectChanges();

			expect(button.getAttribute('aria-label')).toBe('Copy link');
			expect(copy).toHaveBeenCalledWith(IMAGE_URL);
			expect(label(button)).toBe('Copied');
			expect(announce).toHaveBeenCalledWith('Image link copied');

			vi.advanceTimersByTime(3000);
			fixture.detectChanges();
			expect(label(button)).toBe('Copy link');
		});

		it('copies a root-relative URL as an absolute one', () => {
			const copy = vi
				.spyOn(TestBed.inject(Clipboard), 'copy')
				.mockReturnValue(true);
			const { copy: button } = render('/assets/spawn.webp');

			button.click();

			expect(copy).toHaveBeenCalledWith(
				new URL('/assets/spawn.webp', document.baseURI).href
			);
		});

		it('says so when copying fails', () => {
			vi.spyOn(TestBed.inject(Clipboard), 'copy').mockReturnValue(false);
			const { fixture, copy: button, label } = render();

			button.click();
			fixture.detectChanges();

			expect(label(button)).toBe("Couldn't copy");
			expect(announce).toHaveBeenCalledWith(
				"Couldn't copy the image link"
			);
		});
	});

	describe('Download PNG', () => {
		let click: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			URL.createObjectURL = vi.fn(() => 'blob:saved');
			URL.revokeObjectURL = vi.fn();
			click = vi
				.spyOn(HTMLAnchorElement.prototype, 'click')
				.mockImplementation(() => undefined);
		});

		it('fetches the original file and saves it as a PNG named after it', async () => {
			const { fixture, download, label, settle } = render();

			download.click();
			fixture.detectChanges();
			expect(label(download)).toBe('Preparing…');

			const request = TestBed.inject(HttpTestingController).expectOne(
				IMAGE_URL
			);
			expect(request.request.responseType).toBe('blob');
			request.flush(PNG);
			await settle();

			expect(click).toHaveBeenCalledOnce();
			const link = click.mock.contexts[0] as HTMLAnchorElement;
			expect(link.download).toBe('spawn.png');
			expect(URL.createObjectURL).toHaveBeenCalledWith(PNG);
			expect(label(download)).toBe('Download PNG');
			expect(announce).toHaveBeenCalledWith('Download started');
		});

		it('leaves the button alone if another image is shown before it finishes', async () => {
			const { fixture, download, label, settle } = render();

			download.click();
			fixture.componentRef.setInput(
				'imageUrl',
				'https://x.com/other.webp'
			);
			fixture.detectChanges();
			TestBed.inject(HttpTestingController)
				.expectOne(IMAGE_URL)
				.error(new ProgressEvent('error'));
			await settle();

			expect(label(download)).toBe('Download PNG');
			expect(announce).not.toHaveBeenCalled();
		});

		it('saves the clicked image even if another is shown meanwhile', async () => {
			const { fixture, download, settle } = render();

			download.click();
			fixture.componentRef.setInput(
				'imageUrl',
				'https://x.com/other.webp'
			);
			TestBed.inject(HttpTestingController)
				.expectOne(IMAGE_URL)
				.flush(PNG);
			await settle();

			const link = click.mock.contexts[0] as HTMLAnchorElement;
			expect(link.download).toBe('spawn.png');
		});

		it('ignores clicks while a download is being prepared', () => {
			const { fixture, download } = render();

			download.click();
			fixture.detectChanges();
			download.click();

			TestBed.inject(HttpTestingController).expectOne(IMAGE_URL);
		});

		it('says so when the image can’t be fetched', async () => {
			const { download, label, settle } = render();

			download.click();
			TestBed.inject(HttpTestingController)
				.expectOne(IMAGE_URL)
				.error(new ProgressEvent('error'));
			await settle();

			expect(click).not.toHaveBeenCalled();
			expect(label(download)).toBe('Download failed');
			expect(announce).toHaveBeenCalledWith(
				"Couldn't download the image"
			);
		});
	});
});
