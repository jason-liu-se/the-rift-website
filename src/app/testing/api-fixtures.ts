// Canned The Rift API data, shared by the service specs and the e2e mock API
// (e2e/support/mock-api.ts). Typed against the app's interfaces, so changing a
// response shape in the app breaks the fixtures, and every test using them, at
// compile time. Relative imports only: Playwright loads this file in Node.
import {
	ContentVersion,
	DetailVersion,
	DownloadCollection,
	EditorCollection,
	EditorDownloadItemSummary,
	EditorGalleryImage,
	EditorMapSeasonSummary,
	EditorNewsPostSummary,
	GalleryCollection,
	GalleryImage,
	MapSeason,
	NewsPost,
	PaginatedResponse
} from '../interfaces/api-responses';

export const CONTENT_VERSION: ContentVersion = { version: 1763580000000 };
export const NEWS_DETAIL_VERSION: DetailVersion = {
	version: '1763580000000-1'
};

const NEWS_POST_COUNT = 12; // more than one page of 10

export const NEWS_POSTS: NewsPost[] = Array.from(
	{ length: NEWS_POST_COUNT },
	(_, index): NewsPost => ({
		id: `news-${index + 1}`,
		title: `News post ${index + 1}`,
		date: '2026-01-01T00:00:00.000Z',
		content: `Content of news post ${index + 1}.`,
		// The newest post was edited after it went live, and uses markdown.
		...(index === 0 && {
			editedAt: '2026-01-02T12:00:00.000Z',
			content:
				'Content of news post 1, with **bold** text, a [link](/gallery), and a list:\n\n- First\n- Second'
		})
	})
);

const image = (
	name: string,
	caption: string,
	tags: string[] = []
): GalleryImage => ({
	id: name,
	imageUrl: `/assets/general-background-images/${name}`,
	caption,
	tags
});

/** A gallery collection with its images, as the gallery endpoints serve them. */
export interface GalleryCollectionFixture extends GalleryCollection {
	images: GalleryImage[];
}

export const GALLERY_COLLECTIONS: GalleryCollectionFixture[] = [
	{
		slug: 'season5',
		title: 'Season 5',
		images: [
			image('spawn-walkway-1.webp', 'Spawn walkway', ['spawn']),
			image('iron-farm-1.webp', 'Iron farm', ['farm']),
			image('water-tower-1.webp', 'Water tower', ['night', 'spawn'])
		]
	},
	{
		slug: 'season6',
		title: 'Season 6',
		images: [
			image('sunrise-1.webp', 'Sunrise'),
			image('fancy-tree-1.webp', 'Fancy tree')
		]
	}
];

export const DOWNLOAD_COLLECTIONS: DownloadCollection[] = [
	{
		name: 'season5',
		title: 'Season 5',
		items: [
			{
				id: 'season-5-world',
				title: 'World download',
				desc: 'The full season 5 world.',
				downloadUrl: 'https://example.com/season-5.zip',
				imageUrl:
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

// The editor tools' reads (`/editor/*`): the public content above, with the
// audit fields the editor sees, plus a hidden item each.

const EDITOR = { id: '1', username: 'editor' };
/** The same editor with an avatar (a local image: e2e blocks other hosts). */
const EDITOR_WITH_AVATAR = {
	...EDITOR,
	avatarUrl: '/assets/home/grass-block.png'
};

/** `item` without `key`, as a list summary leaves out a long field. */
function omit<T extends object, K extends keyof T>(
	item: T,
	key: K
): Omit<T, K> {
	const copy = { ...item };
	delete copy[key];
	return copy;
}

function withAudit<T extends object>(item: T, index: number) {
	return {
		...item,
		visible: true,
		status: 'live' as const,
		revision: index + 1,
		createdBy: EDITOR_WITH_AVATAR,
		lastUpdatedBy: EDITOR,
		createdAt: '2026-01-01T12:00:00.000Z',
		updatedAt: '2026-01-01T12:00:00.000Z'
	};
}

export const EDITOR_NEWS_POSTS: EditorNewsPostSummary[] = [
	...NEWS_POSTS.map((post, index) => withAudit(omit(post, 'content'), index)),
	{
		...withAudit(
			{
				id: 'news-scheduled',
				title: 'Coming soon',
				date: '2027-01-01T12:00:00.000Z'
			},
			NEWS_POSTS.length
		),
		status: 'scheduled'
	}
];

export const EDITOR_GALLERY_IMAGES: EditorGalleryImage[] =
	GALLERY_COLLECTIONS.flatMap(({ slug, images }) =>
		images.map((image) => ({ ...image, collection: slug }))
	).map(withAudit);

export const EDITOR_GALLERY_COLLECTIONS: EditorCollection[] =
	GALLERY_COLLECTIONS.map(({ slug, title, images }, index) => ({
		...withAudit({ slug, title, itemCount: images.length }, index)
	}));

export const EDITOR_DOWNLOAD_ITEMS: EditorDownloadItemSummary[] =
	DOWNLOAD_COLLECTIONS.flatMap(({ name, items }) =>
		items.map((item) => ({ ...omit(item, 'desc'), collection: name }))
	).map(withAudit);

export const EDITOR_DOWNLOAD_COLLECTIONS: EditorCollection[] =
	DOWNLOAD_COLLECTIONS.map(({ name, title, items }, index) => ({
		...withAudit({ slug: name, title, itemCount: items.length }, index)
	}));

export const EDITOR_MAP_SEASONS: EditorMapSeasonSummary[] = MAP_SEASONS.map(
	({ dimensions, ...season }, index) => ({
		...withAudit(season, index),
		dimensionCount: dimensions.length
	})
);
