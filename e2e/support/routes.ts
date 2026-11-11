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
	{ path: '/', title: 'Minecraft SMP | The Rift' },
	{
		path: '/news',
		title: 'News | The Rift',
		readyText: NEWS_ITEMS[0].title
	},
	{
		path: '/gallery',
		title: 'Gallery | The Rift',
		readyText: `${GALLERY_COLLECTIONS['season-5'].length} photos`
	},
	{
		path: '/gallery/season-5',
		title: 'Season 5 Gallery | The Rift',
		readyText: `Results: ${GALLERY_COLLECTIONS['season-5'].length}`
	},
	{ path: '/map', title: 'Maps | The Rift' },
	{
		path: '/map/season-5-overworld',
		title: 'Season 5 Overworld Map | The Rift'
	},
	{
		path: '/downloads',
		title: 'World Downloads | The Rift',
		readyText: DOWNLOAD_COLLECTIONS[0].items[0].title
	},
	{ path: '/about', title: 'About | The Rift' },
	{ path: '/contact', title: 'Contact Us | The Rift' },
	{ path: '/join', title: 'Join | The Rift' },
	{ path: '/not-a-page', title: 'Page Not Found | The Rift' }
];

export function routeFor(path: string): IE2eRoute {
	const route = ROUTES.find((candidate) => candidate.path === path);
	if (!route) {
		throw new Error(`${path} is not in ROUTES`);
	}
	return route;
}
