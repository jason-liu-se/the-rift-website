import {
	MAX_UPLOAD_BYTES,
	UPLOAD_IMAGE_TYPES
} from '../../../core/config/uploads';

/** Why the API would refuse `file`, or undefined if it's fine to upload. */
export function findImageFileProblem(file: File): string | undefined {
	if (!UPLOAD_IMAGE_TYPES.includes(file.type)) {
		return `${file.name} isn't a PNG, JPEG, WebP, or GIF image.`;
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		const maxMegabytes = MAX_UPLOAD_BYTES / (1024 * 1024);
		return `${file.name} is larger than ${maxMegabytes} MB.`;
	}
	return undefined;
}
