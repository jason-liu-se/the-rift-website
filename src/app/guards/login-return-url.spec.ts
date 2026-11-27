import { TestBed } from '@angular/core/testing';
import {
	BrowserStorage,
	STORAGE_KEYS
} from '../services/browser-storage/browser-storage.service';
import { saveLoginReturnUrl, takeLoginReturnUrl } from './login-return-url';

describe('login return URL', () => {
	beforeEach(() => sessionStorage.clear());

	it('takes a saved path once', () => {
		saveLoginReturnUrl(TestBed.inject(BrowserStorage), '/admin#news');

		expect(takeLoginReturnUrl(TestBed.inject(BrowserStorage))).toBe(
			'/admin#news'
		);
		expect(takeLoginReturnUrl(TestBed.inject(BrowserStorage))).toBeNull();
	});

	it.each(['//evil.example', 'https://evil.example', 'admin'])(
		'ignores anything but a same-site path (%s)',
		(url) => {
			saveLoginReturnUrl(TestBed.inject(BrowserStorage), url);

			expect(
				takeLoginReturnUrl(TestBed.inject(BrowserStorage))
			).toBeNull();
			expect(
				sessionStorage.getItem(STORAGE_KEYS.loginReturnUrl)
			).toBeNull();
		}
	);
});
