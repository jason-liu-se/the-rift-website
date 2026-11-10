// Canned The Rift API data, shared by the service specs and the e2e mock API
// (e2e/support/mock-api.ts). Typed against the app's interfaces, so changing a
// response shape in the app breaks the fixtures, and every test using them, at
// compile time. Relative imports only: Playwright loads this file in Node.
import {
	DownloadCollection,
	GalleryImage,
	NewsItem,
	PaginatedResponse
} from '../interfaces/api-responses';

const NEWS_ITEM_COUNT = 12; // more than one page of 10

export const NEWS_ITEMS: NewsItem[] = Array.from(
	{ length: NEWS_ITEM_COUNT },
	(_, index): NewsItem => ({
		title: `News item ${index + 1}`,
		date: '2026-01-01T00:00:00.000Z',
		content: `Content of news item ${index + 1}.`
	})
);

const image = (name: string, caption: string): GalleryImage => ({
	url: `/assets/general-background-images/${name}`,
	caption
});

export const GALLERY_COLLECTIONS: Record<string, GalleryImage[]> = {
	'season-5': [
		image('spawn-walkway-1.jpg', 'Spawn walkway'),
		image('iron-farm-1.jpg', 'Iron farm'),
		image('water-tower-1.jpg', 'Water tower')
	],
	'season-6': [
		image('sunrise-1.jpg', 'Sunrise'),
		image('fancy-tree-1.jpg', 'Fancy tree')
	]
};

export const DOWNLOAD_COLLECTIONS: DownloadCollection[] = [
	{
		name: 'Season 5',
		items: [
			{
				title: 'World download',
				desc: 'The full season 5 world.',
				downloadUrl: 'https://example.com/season-5.zip',
				backgroundUrl:
					'/assets/general-background-images/mountain-side-1.jpg'
			}
		]
	}
];

/** One page of `items` with the total, as a paginated endpoint answers. */
export function paginate<T>(
	items: T[],
	startIndex: number,
	limit: number
): PaginatedResponse<T> {
	return {
		items: items.slice(startIndex, startIndex + limit),
		total: items.length
	};
}
