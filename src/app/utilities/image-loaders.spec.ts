import { cloudflareImageLoader, originalImageLoader } from './image-loaders';

describe('cloudflareImageLoader', () => {
	it('leaves src as the original, for the fallback', () => {
		expect(cloudflareImageLoader({ src: '/assets/a.webp' })).toBe(
			'/assets/a.webp'
		);
	});

	it('resizes a root-relative image on this site', () => {
		expect(
			cloudflareImageLoader({ src: '/assets/a.webp', width: 640 })
		).toBe(
			'/cdn-cgi/image/format=auto,width=640,onerror=redirect/assets/a.webp'
		);
	});

	it('resizes an image on another host', () => {
		expect(
			cloudflareImageLoader({
				src: 'https://cdn.example/a.png',
				width: 1080
			})
		).toBe(
			'/cdn-cgi/image/format=auto,width=1080,onerror=redirect/https://cdn.example/a.png'
		);
	});
});

describe('originalImageLoader', () => {
	it('returns the original at every width', () => {
		expect(originalImageLoader({ src: '/assets/a.webp', width: 640 })).toBe(
			'/assets/a.webp'
		);
	});
});
