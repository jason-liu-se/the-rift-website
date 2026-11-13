import { TestBed } from '@angular/core/testing';
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
import { environment } from '../../environments/environment';
import {
	AUTH_REFRESH_URL,
	authRefreshInterceptor
} from './auth-refresh.interceptor';

const ME_URL = `${environment.API_URL}/auth/me`;
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('authRefreshInterceptor', () => {
	let http: HttpClient;
	let controller: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authRefreshInterceptor])),
				provideHttpClientTesting()
			]
		});
		http = TestBed.inject(HttpClient);
		controller = TestBed.inject(HttpTestingController);
	});

	afterEach(() => controller.verify());

	function getMe(withCredentials = true) {
		const result: { body?: unknown; error?: HttpErrorResponse } = {};
		http.get(ME_URL, { withCredentials }).subscribe({
			next: (body) => (result.body = body),
			error: (error: HttpErrorResponse) => (result.error = error)
		});
		return result;
	}

	function expectRefresh() {
		const refresh = controller.expectOne(AUTH_REFRESH_URL);
		expect(refresh.request.method).toBe('POST');
		expect(refresh.request.withCredentials).toBe(true);
		return refresh;
	}

	it('refreshes the session and retries a request that answered 401', () => {
		const result = getMe();
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
		expectRefresh().flush(null, { status: 204, statusText: 'No Content' });
		controller.expectOne(ME_URL).flush({ id: '1', username: 'editor' });

		expect(result.body).toEqual({ id: '1', username: 'editor' });
	});

	it("passes on the request's 401 when the refresh fails", () => {
		const result = getMe();
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
		expectRefresh().flush(null, UNAUTHORIZED);

		expect(result.error?.status).toBe(401);
		expect(result.error?.url).toBe(ME_URL);
	});

	it('passes on other errors without refreshing', () => {
		const result = getMe();
		controller
			.expectOne(ME_URL)
			.flush(null, { status: 500, statusText: 'Server Error' });

		expect(result.error?.status).toBe(500);
	});

	it('leaves requests without credentials alone', () => {
		const result = getMe(false);
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);

		expect(result.error?.status).toBe(401);
	});

	it('never refreshes after a failed refresh request', () => {
		let error: HttpErrorResponse | undefined;
		http.post(AUTH_REFRESH_URL, null, { withCredentials: true }).subscribe({
			error: (e: HttpErrorResponse) => (error = e)
		});
		expectRefresh().flush(null, UNAUTHORIZED);

		expect(error?.status).toBe(401);
	});
});
