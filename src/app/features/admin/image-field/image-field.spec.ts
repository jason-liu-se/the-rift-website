import { HttpEventType, provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
	ApiStatus,
	ApiStatusMonitor
} from 'src/app/core/api/api-status/api-status-monitor';
import { environment } from 'src/environments/environment';
import { ImageField, LINK_PROBLEM } from './image-field';

const UPLOAD_URL = `${environment.API_URL}/editor/images`;

describe('ImageField', () => {
	let fixture: ComponentFixture<ImageField>;
	let element: HTMLElement;
	let status: ReturnType<typeof signal<ApiStatus>>;

	const messages = () =>
		element
			.querySelector('.messages')
			?.textContent?.replace(/\s+/g, ' ')
			.trim();
	const button = (name: string) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) =>
				candidate.textContent
					?.replace(
						candidate.querySelector('mat-icon')?.textContent ?? '',
						''
					)
					.trim() === name
		)!;
	function chooseFile(file: File) {
		const input: HTMLInputElement =
			element.querySelector('input[type="file"]')!;
		Object.defineProperty(input, 'files', {
			value: [file],
			configurable: true
		});
		input.dispatchEvent(new Event('change'));
		fixture.detectChanges();
	}
	const png = () => new File(['png'], 'spawn.png', { type: 'image/png' });

	beforeEach(() => {
		status = signal<ApiStatus>('up');
		TestBed.configureTestingModule({
			imports: [ImageField],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: ApiStatusMonitor, useValue: { status } }
			]
		});
		fixture = TestBed.createComponent(ImageField);
		fixture.componentRef.setInput('album', { album: 'news' });
		element = fixture.nativeElement;
		fixture.detectChanges();
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	it('flags a typed link outside the allowlist, but not a saved one', () => {
		fixture.componentInstance.url.set('https://example.com/saved.png');
		fixture.detectChanges();
		expect(messages()).toBe('');

		const link: HTMLInputElement =
			element.querySelector('input[type="url"]')!;
		link.value = 'https://example.com/a.png';
		link.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		expect(messages()).toBe(LINK_PROBLEM);

		link.value = 'https://i.ibb.co/a/spawn.png';
		link.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		expect(messages()).toBe('');
	});

	it('uploads a file into the album, shows progress, and uses its link', () => {
		chooseFile(png());
		const request = TestBed.inject(HttpTestingController).expectOne(
			UPLOAD_URL
		);
		expect((request.request.body as FormData).get('album')).toBe('news');

		request.event({
			type: HttpEventType.UploadProgress,
			loaded: 1,
			total: 2
		});
		fixture.detectChanges();
		expect(element.querySelector('progress')?.value).toBe(0.5);

		request.flush({
			results: [
				{ name: 'spawn.png', url: 'https://i.ibb.co/a/spawn.png' }
			]
		});
		fixture.detectChanges();
		expect(fixture.componentInstance.url()).toBe(
			'https://i.ibb.co/a/spawn.png'
		);
		expect(element.querySelector('progress')).toBeNull();
	});

	it('says why an upload failed, and retries it', () => {
		chooseFile(png());
		TestBed.inject(HttpTestingController)
			.expectOne(UPLOAD_URL)
			.flush({
				results: [{ name: 'spawn.png', error: 'imgbb refused it' }]
			});
		fixture.detectChanges();
		expect(messages()).toContain(
			"Couldn't upload spawn.png: imgbb refused it."
		);

		button('Retry').click();
		TestBed.inject(HttpTestingController)
			.expectOne(UPLOAD_URL)
			.flush({
				results: [
					{ name: 'spawn.png', url: 'https://i.ibb.co/a/spawn.png' }
				]
			});
		fixture.detectChanges();
		expect(messages()).toBe('');
	});

	it("checks a file's type before uploading it", () => {
		chooseFile(new File(['x'], 'notes.txt', { type: 'text/plain' }));

		expect(messages()).toBe(
			"notes.txt isn't a PNG, JPEG, WebP, or GIF image."
		);
	});

	it('turns uploads off while the server is unreachable', () => {
		status.set('offline');
		fixture.detectChanges();

		expect(button('Upload').disabled).toBe(true);
		expect(messages()).toBe(
			'Uploads are off until the server can be reached. Links still work.'
		);
	});

	it('turns uploads off without an album', () => {
		fixture.componentRef.setInput('album', undefined);
		fixture.componentRef.setInput('noAlbumHint', 'Choose a collection.');
		fixture.detectChanges();
		expect(button('Upload').disabled).toBe(true);
		expect(messages()).toBe('Choose a collection.');
	});
});
