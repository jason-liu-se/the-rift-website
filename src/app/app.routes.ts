import { Routes } from '@angular/router';
import {
	requireLoggedIn,
	requireLoggedOut
} from './core/auth/admin-auth.guards';
import {
	requireGalleryCollection,
	resolveFromGalleryTitle
} from './features/gallery/gallery-collection.guard';
import { PageTemplate } from './core/layout/page-template/page-template';

export const routes: Routes = [
	{
		path: '',
		component: PageTemplate,
		title: 'Home',
		data: {
			loadComponent: () =>
				import('./features/home/home-page/home-page').then(
					(m) => m.HomePage
				),
			showContactSection: true
		}
	},
	{
		path: 'news',
		component: PageTemplate,
		title: 'News',
		data: {
			description:
				'The latest news and announcements from The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/news/news-page/news-page').then(
					(m) => m.NewsPage
				),
			isTransparent: false
		}
	},
	{
		path: 'gallery',
		component: PageTemplate,
		title: 'Gallery',
		data: {
			description:
				'Screenshots of builds from every season of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/gallery/gallery-page/gallery-page').then(
					(m) => m.GalleryPage
				)
		}
	},
	{
		// One page per collection the API lists; other names get the 404 page.
		path: 'gallery/:collection',
		canMatch: [requireGalleryCollection],
		component: PageTemplate,
		title: resolveFromGalleryTitle((title) => `${title} Gallery`),
		resolve: {
			collectionTitle: resolveFromGalleryTitle((title) => title),
			description: resolveFromGalleryTitle(
				(title) =>
					`Screenshots of builds from ${title} of The Rift Minecraft SMP.`
			)
		},
		data: {
			loadComponent: () =>
				import('./features/gallery/gallery-showcase-page/gallery-showcase-page').then(
					(m) => m.GalleryShowcasePage
				)
		}
	},
	{
		path: 'map',
		component: PageTemplate,
		title: 'Maps',
		data: {
			description:
				'Explore interactive maps of the worlds from The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/map/map-page/map-page').then(
					(m) => m.MapPage
				)
		}
	},
	{
		path: 'map/viewer',
		component: PageTemplate,
		title: 'Map Viewer',
		data: {
			description:
				'Interactive maps of the worlds on The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/map/blue-map-page/blue-map-page').then(
					(m) => m.BlueMapPage
				),
			isTransparent: false,
			showFooter: false
		}
	},
	{
		path: 'about',
		component: PageTemplate,
		title: 'About',
		data: {
			description: 'Learn what The Rift Minecraft SMP is about.',
			loadComponent: () =>
				import('./features/about/about-page/about-page').then(
					(m) => m.AboutPage
				)
		}
	},
	{
		path: 'downloads',
		component: PageTemplate,
		title: 'World Downloads',
		data: {
			description:
				'Download the worlds from previous seasons of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/downloads/downloads-page/downloads-page').then(
					(m) => m.DownloadsPage
				)
		}
	},
	{
		path: 'contact',
		component: PageTemplate,
		title: 'Contact Us',
		data: {
			description:
				'Get in touch with the team behind The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/contact/contact-page/contact-page').then(
					(m) => m.ContactPage
				)
		}
	},
	{
		path: 'join',
		component: PageTemplate,
		title: 'Join',
		data: {
			description: 'Apply to join The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./features/join/join-page/join-page').then(
					(m) => m.JoinPage
				),
			isTransparent: false
		}
	},
	{
		path: 'admin/login',
		component: PageTemplate,
		title: 'Admin Login',
		canActivate: [requireLoggedOut],
		data: {
			description: 'Log in to edit The Rift website.',
			noindex: true,
			loadComponent: () =>
				import('./features/admin/admin-login-page/admin-login-page').then(
					(m) => m.AdminLoginPage
				),
			isTransparent: false,
			showFooter: false
		}
	},
	{
		path: 'admin',
		component: PageTemplate,
		title: 'Admin',
		canActivate: [requireLoggedIn],
		data: {
			description: 'Tools for editors of The Rift website.',
			noindex: true,
			loadComponent: () =>
				import('./features/admin/admin-page/admin-page').then(
					(m) => m.AdminPage
				),
			showNavbar: false,
			showFooter: false
		},
		loadChildren: () => import('./features/admin/admin.routes')
	},
	{
		path: '**',
		component: PageTemplate,
		title: 'Page Not Found',
		data: {
			noindex: true,
			loadComponent: () =>
				import('./features/error/error-page/error-page').then(
					(m) => m.ErrorPage
				),
			isTransparent: false
		}
	}
];
