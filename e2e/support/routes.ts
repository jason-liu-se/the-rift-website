// Every page the e2e suite visits. Keep in sync with
// src/app/app.routes.ts (one entry per page variant is enough).
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	NEWS_ITEMS
} from '../../src/app/testing/api-fixtures';

export interface IE2eRoute {
	path: string;
	title: string;
	// Text that only appears once the page's API data has rendered.
	readyText?: string;
}

export const ROUTES: readonly IE2eRoute[] = [
	{ path: '/', title: 'The Rift - Home' },
	{
		path: '/news',
		title: 'The Rift - News',
		readyText: NEWS_ITEMS[0].title
	},
	{
		path: '/gallery',
		title: 'The Rift - Gallery',
		readyText: `${GALLERY_COLLECTIONS['season-5'].length} photos`
	},
	{
		path: '/gallery/season-5',
		title: 'The Rift - Gallery: Season 5',
		readyText: `Results: ${GALLERY_COLLECTIONS['season-5'].length}`
	},
	{ path: '/map', title: 'The Rift - Map' },
	{ path: '/map/season-5-overworld', title: 'The Rift - Map: Season 5' },
	{
		path: '/downloads',
		title: 'The Rift - Downloads',
		readyText: DOWNLOAD_COLLECTIONS[0].items[0].title
	},
	{ path: '/about', title: 'The Rift - About' },
	{ path: '/contact', title: 'The Rift - Contact Us' },
	{ path: '/join', title: 'The Rift - Join' },
	{ path: '/not-a-page', title: 'The Rift - Error 404' }
];

export function routeFor(path: string): IE2eRoute {
	const route = ROUTES.find((candidate) => candidate.path === path);
	if (!route) {
		throw new Error(`${path} is not in ROUTES`);
	}
	return route;
}
