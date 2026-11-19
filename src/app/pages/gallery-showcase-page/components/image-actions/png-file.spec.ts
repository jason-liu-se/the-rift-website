import { pngFileName, toPng } from './png-file';

describe('pngFileName', () => {
	it.each([
		['https://x.com/a/spawn-walkway-1.webp', 'spawn-walkway-1.png'],
		['https://x.com/a/spawn%20walk.jpeg?v=2#top', 'spawn walk.png'],
		['https://x.com/a/no-extension', 'no-extension.png'],
		['https://x.com/', 'image.png']
	])('names %s as %s', (url, name) => {
		expect(pngFileName(url)).toBe(name);
	});
});

describe('toPng', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('keeps a PNG as it is', async () => {
		const png = new Blob(['png'], { type: 'image/png' });
		expect(await toPng(png)).toBe(png);
	});

	it('redraws any other image at full size and encodes it as PNG', async () => {
		const bitmap = { width: 1920, height: 1080, close: vi.fn() };
		const drawImage = vi.fn();
		const converted = new Blob(['converted'], { type: 'image/png' });
		const canvases: { width: number; height: number }[] = [];
		const convertToBlob = vi.fn().mockResolvedValue(converted);
		vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				constructor(width: number, height: number) {
					canvases.push({ width, height });
				}
				getContext = () => ({ drawImage });
				convertToBlob = convertToBlob;
			}
		);

		const result = await toPng(new Blob(['webp'], { type: 'image/webp' }));

		expect(canvases).toEqual([{ width: 1920, height: 1080 }]);
		expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
		expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/png' });
		expect(bitmap.close).toHaveBeenCalled();
		expect(result).toBe(converted);
	});

	it('fails, and frees the bitmap, without a 2D canvas context', async () => {
		const bitmap = { width: 1, height: 1, close: vi.fn() };
		vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				getContext = () => null;
			}
		);

		await expect(
			toPng(new Blob(['webp'], { type: 'image/webp' }))
		).rejects.toThrow();
		expect(bitmap.close).toHaveBeenCalled();
	});
});
