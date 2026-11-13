import { Routes } from '@angular/router';
import { requireLoggedIn, requireLoggedOut } from './guards/admin-auth.guards';
import { PageTemplateComponent } from './pages/page-template/page-template.component';

export const routes: Routes = [
	{
		path: '',
		component: PageTemplateComponent,
		title: 'Home',
		data: {
			loadComponent: () =>
				import('./pages/home-page/home-page.component').then(
					(m) => m.HomePageComponent
				),
			showContactSection: true
		}
	},
	{
		path: 'news',
		component: PageTemplateComponent,
		title: 'News',
		data: {
			description:
				'The latest news and announcements from The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/news-page/news-page.component').then(
					(m) => m.NewsPageComponent
				),
			isTransparent: false
		}
	},
	{
		path: 'gallery',
		component: PageTemplateComponent,
		title: 'Gallery',
		data: {
			description:
				'Screenshots of builds from every season of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/gallery-page/gallery-page.component').then(
					(m) => m.GalleryPageComponent
				)
		}
	},
	{
		path: 'gallery/season-5',
		component: PageTemplateComponent,
		title: 'Season 5 Gallery',
		data: {
			description:
				'Screenshots of builds from Season 5 of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/gallery-showcase-page/gallery-showcase-page.component').then(
					(m) => m.GalleryShowcasePageComponent
				),
			title: 'Gallery: Season 5',
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.webp',
			collection: 'season-5'
		}
	},
	{
		path: 'gallery/season-6',
		component: PageTemplateComponent,
		title: 'Season 6 Gallery',
		data: {
			description:
				'Screenshots of builds from Season 6 of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/gallery-showcase-page/gallery-showcase-page.component').then(
					(m) => m.GalleryShowcasePageComponent
				),
			title: 'Gallery: Season 6',
			imageUrl:
				'../../../assets/general-background-images/magic-books-2.webp',
			collection: 'season-6'
		}
	},
	{
		path: 'map',
		component: PageTemplateComponent,
		title: 'Maps',
		data: {
			description:
				'Explore interactive maps of the worlds from The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/map-page/map-page.component').then(
					(m) => m.MapPageComponent
				)
		}
	},
	{
		path: 'map/season-5-overworld',
		component: PageTemplateComponent,
		title: 'Season 5 Overworld Map',
		data: {
			description:
				'Interactive map of the Season 5 overworld on The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/blue-map-page/blue-map-page.component').then(
					(m) => m.BlueMapPageComponent
				),
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_overworld'
		}
	},
	{
		path: 'map/season-5-nether',
		component: PageTemplateComponent,
		title: 'Season 5 Nether Map',
		data: {
			description:
				'Interactive map of the Season 5 Nether on The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/blue-map-page/blue-map-page.component').then(
					(m) => m.BlueMapPageComponent
				),
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_nether'
		}
	},
	{
		path: 'map/season-5-end',
		component: PageTemplateComponent,
		title: 'Season 5 End Map',
		data: {
			description:
				'Interactive map of the Season 5 End on The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/blue-map-page/blue-map-page.component').then(
					(m) => m.BlueMapPageComponent
				),
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_end'
		}
	},
	{
		path: 'about',
		component: PageTemplateComponent,
		title: 'About',
		data: {
			description: 'Learn what The Rift Minecraft SMP is about.',
			loadComponent: () =>
				import('./pages/about-page/about-page.component').then(
					(m) => m.AboutPageComponent
				)
		}
	},
	{
		path: 'downloads',
		component: PageTemplateComponent,
		title: 'World Downloads',
		data: {
			description:
				'Download the worlds from previous seasons of The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/downloads-page/downloads-page.component').then(
					(m) => m.DownloadsPageComponent
				)
		}
	},
	{
		path: 'contact',
		component: PageTemplateComponent,
		title: 'Contact Us',
		data: {
			description:
				'Get in touch with the team behind The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/contact-page/contact-page.component').then(
					(m) => m.ContactPageComponent
				)
		}
	},
	{
		path: 'join',
		component: PageTemplateComponent,
		title: 'Join',
		data: {
			description: 'Apply to join The Rift Minecraft SMP.',
			loadComponent: () =>
				import('./pages/join-page/join-page.component').then(
					(m) => m.JoinPageComponent
				),
			isTransparent: false
		}
	},
	{
		path: 'admin',
		component: PageTemplateComponent,
		title: 'Admin',
		canActivate: [requireLoggedIn],
		data: {
			description: 'Tools for editors of The Rift website.',
			noindex: true,
			loadComponent: () =>
				import('./pages/admin-page/admin-page.component').then(
					(m) => m.AdminPageComponent
				),
			isTransparent: false
		}
	},
	{
		path: 'admin/login',
		component: PageTemplateComponent,
		title: 'Admin Login',
		canActivate: [requireLoggedOut],
		data: {
			description: 'Log in to edit The Rift website.',
			noindex: true,
			loadComponent: () =>
				import('./pages/admin-page/admin-login-page/admin-login-page.component').then(
					(m) => m.AdminLoginPageComponent
				),
			isTransparent: false
		}
	},
	{
		path: '**',
		component: PageTemplateComponent,
		title: 'Page Not Found',
		data: {
			noindex: true,
			loadComponent: () =>
				import('./pages/error-page/error-page.component').then(
					(m) => m.ErrorPageComponent
				),
			isTransparent: false
		}
	}
];
