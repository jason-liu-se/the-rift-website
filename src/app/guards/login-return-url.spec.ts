import {
	LOGIN_RETURN_URL_KEY,
	saveLoginReturnUrl,
	takeLoginReturnUrl
} from './login-return-url';

describe('login return URL', () => {
	beforeEach(() => sessionStorage.clear());

	it('takes a saved path once', () => {
		saveLoginReturnUrl('/admin#news');

		expect(takeLoginReturnUrl()).toBe('/admin#news');
		expect(takeLoginReturnUrl()).toBeNull();
	});

	it.each(['//evil.example', 'https://evil.example', 'admin'])(
		'ignores anything but a same-site path (%s)',
		(url) => {
			saveLoginReturnUrl(url);

			expect(takeLoginReturnUrl()).toBeNull();
			expect(sessionStorage.getItem(LOGIN_RETURN_URL_KEY)).toBeNull();
		}
	);
});
