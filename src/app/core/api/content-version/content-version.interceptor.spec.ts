import {
	HttpClient,
	provideHttpClient,
	withInterceptors
} from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONTENT_VERSION } from '../../../testing/api-fixtures';
import { CONTENT_VERSION_MAX_AGE_MS } from '../../config/api';
import { environment } from '../../../../environments/environment';
import { contentVersionInterceptor } from './content-version.interceptor';
import { unversioned } from './content-version.service';

describe('contentVersionInterceptor', () => {
	const versionUrl = `${environment.API_URL}/content/version`;
	const newsVersionUrl = `${environment.API_URL}/content/version/news`;
	const newsUrl = `${environment.API_URL}/news`;
	const downloadsUrl = `${environment.API_URL}/downloads`;
	const NEWS_DETAIL_VERSION = '1767225600000-3';
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
		http.get(downloadsUrl, { params: { limit: 5 } }).subscribe();
		http.get(`${environment.API_URL}/maps/seasons`).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);

		const v = CONTENT_VERSION.version;
		controller.expectOne(`${downloadsUrl}?limit=5&v=${v}`);
		controller.expectOne(`${environment.API_URL}/maps/seasons?v=${v}`);

		http.get(`${environment.API_URL}/gallery`).subscribe();
		controller.expectOne(`${environment.API_URL}/gallery?v=${v}`);
		controller.expectNone(newsVersionUrl);
	});

	it('sends the news detail version as dv on news reads only', () => {
		const v = CONTENT_VERSION.version;
		http.get(newsUrl, { params: { limit: 5 } }).subscribe();
		http.get(`${newsUrl}/count`).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller
			.expectOne(newsVersionUrl)
			.flush({ version: NEWS_DETAIL_VERSION });

		controller.expectOne(
			`${newsUrl}?limit=5&v=${v}&dv=${NEWS_DETAIL_VERSION}`
		);
		controller.expectOne(
			`${newsUrl}/count?v=${v}&dv=${NEWS_DETAIL_VERSION}`
		);

		http.get(`${environment.API_URL}/newsletter`).subscribe();
		controller.expectOne(`${environment.API_URL}/newsletter?v=${v}`);
	});

	it('reads news without dv when the detail version fails', () => {
		http.get(newsUrl).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller
			.expectOne(newsVersionUrl)
			.flush(null, { status: 500, statusText: 'Server Error' });
		controller.expectOne(`${newsUrl}?v=${CONTENT_VERSION.version}`);
	});

	it('leaves writes, opted-out GETs, and other hosts alone', () => {
		http.post(downloadsUrl, {}).subscribe();
		http.get(`${environment.API_URL}/auth/me`, {
			context: unversioned()
		}).subscribe();
		http.get('https://example.com/data').subscribe();

		controller.expectNone(versionUrl);
		controller.expectOne({ method: 'POST', url: downloadsUrl });
		controller.expectOne(`${environment.API_URL}/auth/me`);
		controller.expectOne('https://example.com/data');
	});

	it('reads without v when the version fails, and fetches it again next time', () => {
		http.get(downloadsUrl).subscribe();
		controller
			.expectOne(versionUrl)
			.flush(null, { status: 500, statusText: 'Server Error' });
		controller.expectOne(downloadsUrl);

		http.get(downloadsUrl).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller.expectOne(`${downloadsUrl}?v=${CONTENT_VERSION.version}`);
	});

	it('fetches the version again once it is too old', () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const newVersion = CONTENT_VERSION.version + 1;

		http.get(downloadsUrl).subscribe();
		controller.expectOne(versionUrl).flush(CONTENT_VERSION);
		controller.expectOne(`${downloadsUrl}?v=${CONTENT_VERSION.version}`);

		vi.advanceTimersByTime(CONTENT_VERSION_MAX_AGE_MS);
		http.get(downloadsUrl).subscribe();
		controller.expectNone(versionUrl);
		controller.expectOne(`${downloadsUrl}?v=${CONTENT_VERSION.version}`);

		vi.advanceTimersByTime(1);
		http.get(downloadsUrl).subscribe();
		controller.expectOne(versionUrl).flush({ version: newVersion });
		controller.expectOne(`${downloadsUrl}?v=${newVersion}`);
	});
});
