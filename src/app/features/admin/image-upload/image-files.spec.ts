import { MAX_UPLOAD_BYTES } from '../../../core/config/uploads';
import { findImageFileProblem } from './image-files';

const file = (name: string, type: string, size = 10) =>
	new File([new Uint8Array(size)], name, { type });

describe('findImageFileProblem', () => {
	it('accepts the image types the API takes', () => {
		for (const type of [
			'image/png',
			'image/jpeg',
			'image/webp',
			'image/gif'
		]) {
			expect(findImageFileProblem(file('a', type))).toBeUndefined();
		}
	});

	it('refuses other types and files that are too large', () => {
		expect(findImageFileProblem(file('a.svg', 'image/svg+xml'))).toBe(
			"a.svg isn't a PNG, JPEG, WebP, or GIF image."
		);
		expect(
			findImageFileProblem(
				file('big.png', 'image/png', MAX_UPLOAD_BYTES + 1)
			)
		).toBe('big.png is larger than 10 MB.');
	});
});
