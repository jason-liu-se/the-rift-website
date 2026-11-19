import {
	HttpClient,
	HttpErrorResponse,
	provideHttpClient,
	withInterceptors
} from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONTENT_VERSION } from '../../testing/api-fixtures';
import { CONTENT_VERSION_MAX_AGE_MS } from '../../config/api';
import { environment } from '../../../environments/environment';
import { contentVersionInterceptor } from './content-version.interceptor';
import { unversioned } from './content-version.service';

describe('contentVersionInterceptor', () => {
	const versionUrl = `${environment.API_URL}/content/version`;
	const newsUrl = `${environment.API_URL}/news`;
	let http: HttpClient;
	let controller: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(
					withInterceptors([contentVersionInterceptor])
				),
				provideHttpClientTesting()
			]
		});
		http = TestBed.inject(HttpClient);
		controller = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		controller.verify();
		vi.useRealTimers();
	});

	it('fetches the version once and sends it as v on every API GET', () => {
		http.get(newsUrl, { params: { limit: 5 } }).subscribe();
		http.get(`${environment.API_URL}/downloads`).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);

		const v = CONTENT_VERSION.version;
		controller.expectOne(`${newsUrl}?limit=5&v=${v}`);
		controller.expectOne(`${environment.API_URL}/downloads?v=${v}`);

		http.get(`${environment.API_URL}/gallery`).subscribe();
		controller.expectOne(`${environment.API_URL}/gallery?v=${v}`);
	});

	it('leaves writes, opted-out GETs, and other hosts alone', () => {
		http.post(newsUrl, {}).subscribe();
		http.get(`${environment.API_URL}/auth/me`, {
			context: unversioned()
		}).subscribe();
		http.get('https://example.com/data').subscribe();

		controller.expectNone(versionUrl);
		controller.expectOne({ method: 'POST', url: newsUrl });
		controller.expectOne(`${environment.API_URL}/auth/me`);
		controller.expectOne('https://example.com/data');
	});

	it('fails the read when the version fails, and fetches it again next time', () => {
		let error: HttpErrorResponse | undefined;
		http.get(newsUrl).subscribe({
			error: (e: HttpErrorResponse) => (error = e)
		});
		controller
			.expectOne(versionUrl)
			.flush(null, { status: 500, statusText: 'Server Error' });

		expect(error?.status).toBe(500);
		controller.expectNone(newsUrl);

		http.get(newsUrl).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller.expectOne(`${newsUrl}?v=${CONTENT_VERSION.version}`);
	});

	it('fetches the version again once it is too old', () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const newVersion = CONTENT_VERSION.version + 1;

		http.get(newsUrl).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller.expectOne(`${newsUrl}?v=${CONTENT_VERSION.version}`);

		vi.advanceTimersByTime(CONTENT_VERSION_MAX_AGE_MS);
		http.get(newsUrl).subscribe();
		controller.expectNone(versionUrl);
		controller.expectOne(`${newsUrl}?v=${CONTENT_VERSION.version}`);

		vi.advanceTimersByTime(1);
		http.get(newsUrl).subscribe();
		controller.expectOne(versionUrl).flush({ version: newVersion });
		controller.expectOne(`${newsUrl}?v=${newVersion}`);
	});
});
