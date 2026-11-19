import { cloudflareImageLoader, originalImageLoader } from './image-loaders';

const resized = (width: number, source: string) =>
	`/cdn-cgi/image/format=webp,width=${width},onerror=redirect/${source}`;

describe('cloudflareImageLoader', () => {
	it('leaves src as the original, for the fallback', () => {
		expect(cloudflareImageLoader({ src: '/assets/a.webp' })).toBe(
			'/assets/a.webp'
		);
	});

	it('resizes a root-relative image on this site to WebP', () => {
		expect(
			cloudflareImageLoader({ src: '/assets/a.webp', width: 960 })
		).toBe(resized(960, 'assets/a.webp'));
	});

	it('resizes an image on another host', () => {
		expect(
			cloudflareImageLoader({
				src: 'https://cdn.example/a.png',
				width: 480
			})
		).toBe(resized(480, 'https://cdn.example/a.png'));
	});

	it.each([
		{ width: 100, expected: 480 },
		{ width: 481, expected: 960 },
		{ width: 1200, expected: 1920 },
		{ width: 3840, expected: 1920 }
	])(
		'only requests the mobile, tablet, or desktop width: $width → $expected',
		({ width, expected }) => {
			expect(cloudflareImageLoader({ src: '/a.webp', width })).toBe(
				resized(expected, 'a.webp')
			);
		}
	);

	it('returns the original at every width when original is requested', () => {
		expect(
			cloudflareImageLoader({
				src: '/assets/a.webp',
				width: 960,
				loaderParams: { original: true }
			})
		).toBe('/assets/a.webp');
	});
});

describe('originalImageLoader', () => {
	it('returns the original at every width', () => {
		expect(originalImageLoader({ src: '/assets/a.webp', width: 960 })).toBe(
			'/assets/a.webp'
		);
	});
});
