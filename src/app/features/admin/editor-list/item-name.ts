import { toPlainText } from 'src/app/shared/utils/markdown';

/** The fields that name an item or draft, whichever its type has. */
interface NamingFields {
	title?: string;
	caption?: string;
	season?: number;
}

/**
 * An item's or draft's name, as plain text, for buttons and messages: a news
 * title (markdown stripped), a caption, a download title, or a season.
 */
export function itemName({ title, caption, season }: NamingFields): string {
	const name =
		(title && toPlainText(title)) ||
		caption ||
		(season !== undefined ? `Season ${season}` : '');
	return name.trim() || 'Untitled';
}
