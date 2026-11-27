import { isAllowedImageUrl } from './image-urls';

describe('isAllowedImageUrl', () => {
	it.each([
		['https://i.ibb.co/abc/spawn.png', true],
		['https://i.imgur.com/abc.png', true],
		['https://imgur.com/abc', true],
		['http://i.ibb.co/abc/spawn.png', false],
		['https://i.ibb.co.evil.com/spawn.png', false],
		['https://example.com/https://i.ibb.co/', false],
		['', false]
	])('%s: %s', (url, isAllowed) => {
		expect(isAllowedImageUrl(url)).toBe(isAllowed);
	});
});
