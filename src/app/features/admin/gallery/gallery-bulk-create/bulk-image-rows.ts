import { MAX_GALLERY_CAPTION_LENGTH } from 'src/app/core/config/content-limits';
import { GalleryImageCreateRequest } from 'src/app/core/api/api-requests';
import { isAllowedImageUrl } from 'src/app/shared/utils/image-urls';

/** One image in a bulk creation, edited before it's published. */
export interface BulkImageRow {
	/** The create's createId, kept across retries so a repeat makes no copy. */
	id: string;
	/** A picked file, until it's uploaded. */
	file?: File;
	/** The thumbnail: the file's object URL, or the link. */
	previewUrl: string;
	/** The uploaded or pasted link. */
	imageUrl?: string;
	caption: string;
	collection: string;
	tags: string[];
	isVisible: boolean;
	/** Why the last try failed, shown on the row. */
	problem?: string;
}

/** A caption from a file's name: `spawn_walkway-1.png` → `Spawn walkway 1`. */
export function captionFromFileName(fileName: string): string {
	const words = fileName
		.replace(/\.[^.]+$/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const caption = words.charAt(0).toUpperCase() + words.slice(1);
	return caption.slice(0, MAX_GALLERY_CAPTION_LENGTH);
}

/** Links pasted one per line (or separated by spaces), without blanks. */
export function parsePastedLinks(text: string): string[] {
	return text
		.split(/\s+/)
		.map((link) => link.trim())
		.filter(Boolean);
}

/** Why a row can't be published yet, or undefined when it can. */
export function findRowProblem(row: BulkImageRow): string | undefined {
	if (!row.collection) {
		return 'Choose a collection.';
	}
	if (!row.caption.trim()) {
		return 'Add a caption.';
	}
	if (row.imageUrl !== undefined && !isAllowedImageUrl(row.imageUrl)) {
		return "This link isn't from imgbb or imgur.";
	}
	return undefined;
}

export function toCreateRequest(row: BulkImageRow): GalleryImageCreateRequest {
	return {
		createId: row.id,
		collection: row.collection,
		caption: row.caption.trim(),
		imageUrl: row.imageUrl!,
		tags: row.tags,
		visible: row.isVisible
	};
}
