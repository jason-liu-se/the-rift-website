// Mirrors the API's upload limits (its src/config/uploads.ts), so a file it
// would refuse is flagged before uploading. The API's are the ones enforced.

/** Files per upload request. */
export const MAX_UPLOAD_FILES = 20;

/** One file's size, in bytes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** The image types the API accepts (it checks the file's bytes too). */
export const UPLOAD_IMAGE_TYPES: readonly string[] = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif'
];
