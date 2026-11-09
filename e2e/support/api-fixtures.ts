// Canned API data, typed against the app's interfaces so a shape change in
// the app breaks the fixtures at compile time.
import { IDownloadCollection } from '../../src/app/interfaces/download-collection.interface';
import { INewsItem } from '../../src/app/interfaces/news-item.interface';
import { ICaptionCard } from '../../src/app/interfaces/slideshow-image.interface';

const NEWS_ITEM_COUNT = 12; // more than one page of 10

export const NEWS_ITEMS: INewsItem[] = Array.from(
	{ length: NEWS_ITEM_COUNT },
	(_, index) => ({
		title: `News item ${index + 1}`,
		date: '2026-01-01T00:00:00.000Z',
		content: `Content of news item ${index + 1}.`
	})
);

const image = (name: string, caption: string): ICaptionCard => ({
	url: `/assets/general-background-images/${name}`,
	caption
});

export const GALLERY_COLLECTIONS: Record<string, ICaptionCard[]> = {
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

export const DOWNLOAD_COLLECTIONS: IDownloadCollection[] = [
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
