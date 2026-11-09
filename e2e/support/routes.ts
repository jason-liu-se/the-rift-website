// Every page the e2e suite visits. Keep in sync with
// src/app/app-routing.module.ts (one entry per page variant is enough).
export interface IE2eRoute {
	path: string;
	title: string;
}

export const ROUTES: readonly IE2eRoute[] = [
	{ path: '/', title: 'The Rift - Home' },
	{ path: '/news', title: 'The Rift - News' },
	{ path: '/gallery', title: 'The Rift - Gallery' },
	{ path: '/gallery/season-5', title: 'The Rift - Gallery: Season 5' },
	{ path: '/map', title: 'The Rift - Map' },
	{ path: '/map/season-5-overworld', title: 'The Rift - Map: Season 5' },
	{ path: '/downloads', title: 'The Rift - Downloads' },
	{ path: '/about', title: 'The Rift - About' },
	{ path: '/contact', title: 'The Rift - Contact Us' },
	{ path: '/join', title: 'The Rift - Join' },
	{ path: '/not-a-page', title: 'The Rift - Error 404' }
];
