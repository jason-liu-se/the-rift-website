import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { NewsPageComponent } from './pages/news-page/news-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { MapPageComponent } from './pages/map-page/map-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PageTemplateComponent } from './pages/page-template/page-template.component';
import { DownloadsPageComponent } from './pages/downloads-page/downloads-page.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { GalleryShowcasePageComponent } from './pages/gallery-showcase-page/gallery-showcase-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { JoinPageComponent } from './pages/join-page/join-page.component';
import { BlueMapPageComponent } from './pages/blue-map-page/blue-map-page.component';

const routes: Routes = [
	{
		path: '',
		component: PageTemplateComponent,
		title: 'The Rift - Home',
		data: { component: HomePageComponent, showContactSection: true }
	},
	{
		path: 'news',
		component: PageTemplateComponent,
		title: 'The Rift - News',
		data: { component: NewsPageComponent, isTransparent: false }
	},
	{
		path: 'gallery',
		component: PageTemplateComponent,
		title: 'The Rift - Gallery',
		data: { component: GalleryPageComponent }
	},
	{
		path: 'gallery/season-5',
		component: PageTemplateComponent,
		title: 'The Rift - Gallery: Season 5',
		data: {
			component: GalleryShowcasePageComponent,
			title: 'Gallery: Season 5',
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.png',
			collection: 'season-5'
		}
	},
	{
		path: 'gallery/season-6',
		component: PageTemplateComponent,
		title: 'The Rift - Gallery: Season 6',
		data: {
			component: GalleryShowcasePageComponent,
			title: 'Gallery: Season 6',
			imageUrl:
				'../../../assets/general-background-images/magic-books-2.jpg',
			collection: 'season-6'
		}
	},
	{
		path: 'map',
		component: PageTemplateComponent,
		title: 'The Rift - Map',
		data: { component: MapPageComponent }
	},
	{
		path: 'map/season-5-overworld',
		component: PageTemplateComponent,
		title: 'The Rift - Map: Season 5',
		data: {
			component: BlueMapPageComponent,
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_overworld'
		}
	},
	{
		path: 'map/season-5-nether',
		component: PageTemplateComponent,
		title: 'The Rift - Map: Season 5',
		data: {
			component: BlueMapPageComponent,
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_nether'
		}
	},
	{
		path: 'map/season-5-end',
		component: PageTemplateComponent,
		title: 'The Rift - Map: Season 5',
		data: {
			component: BlueMapPageComponent,
			isTransparent: false,
			showFooter: false,
			mapName: 'season_5_end'
		}
	},
	{
		path: 'about',
		component: PageTemplateComponent,
		title: 'The Rift - About',
		data: { component: AboutPageComponent }
	},
	{
		path: 'downloads',
		component: PageTemplateComponent,
		title: 'The Rift - Downloads',
		data: { component: DownloadsPageComponent }
	},
	{
		path: 'contact',
		component: PageTemplateComponent,
		title: 'The Rift - Contact Us',
		data: { component: ContactPageComponent }
	},
	{
		path: 'join',
		component: PageTemplateComponent,
		title: 'The Rift - Join',
		data: {
			component: JoinPageComponent,
			isTransparent: false
		}
	},

	{
		path: '**',
		component: PageTemplateComponent,
		title: 'The Rift - Error 404',
		data: {
			component: ErrorPageComponent,
			isTransparent: false
		}
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })
	],
	exports: [RouterModule]
})
export class AppRoutingModule {}
