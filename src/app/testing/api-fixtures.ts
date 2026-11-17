// Canned The Rift API data, shared by the service specs and the e2e mock API
// (e2e/support/mock-api.ts). Typed against the app's interfaces, so changing a
// response shape in the app breaks the fixtures, and every test using them, at
// compile time. Relative imports only: Playwright loads this file in Node.
import {
	DownloadCollection,
	GalleryImage,
	MapSeason,
	NewsPost,
	PaginatedResponse
} from '../interfaces/api-responses';

const NEWS_POST_COUNT = 12; // more than one page of 10

export const NEWS_POSTS: NewsPost[] = Array.from(
	{ length: NEWS_POST_COUNT },
	(_, index): NewsPost => ({
		id: `news-${index + 1}`,
		title: `News post ${index + 1}`,
		date: '2026-01-01T00:00:00.000Z',
		content: `Content of news post ${index + 1}.`
	})
);

const image = (name: string, caption: string): GalleryImage => ({
	id: name,
	url: `/assets/general-background-images/${name}`,
	caption
});

export const GALLERY_COLLECTIONS: Record<string, GalleryImage[]> = {
	'season-5': [
		image('spawn-walkway-1.webp', 'Spawn walkway'),
		image('iron-farm-1.webp', 'Iron farm'),
		image('water-tower-1.webp', 'Water tower')
	],
	'season-6': [
		image('sunrise-1.webp', 'Sunrise'),
		image('fancy-tree-1.webp', 'Fancy tree')
	]
};

export const DOWNLOAD_COLLECTIONS: DownloadCollection[] = [
	{
		name: 'Season 5',
		items: [
			{
				id: 'season-5-world',
				title: 'World download',
				desc: 'The full season 5 world.',
				downloadUrl: 'https://example.com/season-5.zip',
				backgroundUrl:
					'/assets/general-background-images/mountain-side-1.webp'
			}
		]
	}
];

const SEASON_5_IMAGE = '/assets/general-background-images/season-5-circle.webp';

export const MAP_SEASONS: MapSeason[] = [
	{
		id: 'season-5',
		season: 5,
		imageUrl: SEASON_5_IMAGE,
		dimensions: ['Overworld', 'Nether', 'End'].map((name) => ({
			name,
			imageUrl: SEASON_5_IMAGE,
			worldId: `season_5_${name.toLowerCase()}`,
			perspective: ':0:0:0:1500:0:0:0:0:'
		}))
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
