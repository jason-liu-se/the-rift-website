const PNG_TYPE = 'image/png';
const FALLBACK_NAME = 'image';

/** `https://x.com/a/spawn%20walk.webp?v=2` → `spawn walk.png`. */
export function pngFileName(url: string): string {
	const lastSegment = new URL(url).pathname.split('/').pop() ?? '';
	const name = decodeURIComponent(lastSegment).replace(/\.[^.]*$/, '');
	return `${name || FALLBACK_NAME}.png`;
}

/** Re-encodes an image as PNG, which is lossless, so it keeps every pixel. */
export async function toPng(image: Blob): Promise<Blob> {
	if (image.type === PNG_TYPE) {
		return image;
	}

	const bitmap = await createImageBitmap(image);
	try {
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('No 2D canvas context');
		}
		context.drawImage(bitmap, 0, 0);
		return await canvas.convertToBlob({ type: PNG_TYPE });
	} finally {
		bitmap.close();
	}
}

/** Saves a file to the browser's downloads folder. */
export function saveFile(file: Blob, name: string, document: Document): void {
	const link = document.createElement('a');
	link.href = URL.createObjectURL(file);
	link.download = name;
	link.click();
	// Revoking straight after click() can cancel the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(link.href));
}
