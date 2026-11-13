import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { SessionUser } from '../interfaces/api-responses';
import { AuthService } from './auth.service';

describe('AuthService', () => {
	let service: AuthService;
	let controller: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(AuthService);
		controller = TestBed.inject(HttpTestingController);
	});

	afterEach(() => controller.verify());

	it('links to the Discord login', () => {
		expect(service.loginUrl).toBe(`${environment.API_URL}/auth/discord`);
	});

	it('gets the logged-in user with the session cookies', () => {
		const user: SessionUser = { id: '1', username: 'editor' };
		let result: SessionUser | undefined;
		service.getMe().subscribe((me) => (result = me));

		const request = controller.expectOne(`${environment.API_URL}/auth/me`);
		expect(request.request.method).toBe('GET');
		expect(request.request.withCredentials).toBe(true);
		request.flush(user);

		expect(result).toEqual(user);
	});

	it('logs out with the session cookies', () => {
		let done = false;
		service.logout().subscribe({ complete: () => (done = true) });

		const request = controller.expectOne(
			`${environment.API_URL}/auth/logout`
		);
		expect(request.request.method).toBe('POST');
		expect(request.request.withCredentials).toBe(true);
		request.flush(null, { status: 204, statusText: 'No Content' });

		expect(done).toBe(true);
	});
});
