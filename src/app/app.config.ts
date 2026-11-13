import {
	provideHttpClient,
	withFetch,
	withInterceptors
} from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
	provideClientHydration,
	withEventReplay
} from '@angular/platform-browser';
import {
	TitleStrategy,
	provideRouter,
	withInMemoryScrolling
} from '@angular/router';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './seo/seo-title-strategy';
import { serverApiTimeoutInterceptor } from './services/server-api-timeout.interceptor';

/** App-wide providers, shared by the browser and server builds. */
export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(
			routes,
			// A fragment change (e.g. the admin page's tool tabs) scrolls to the
			// matching id, if any, instead of to the top.
			withInMemoryScrolling({
				scrollPositionRestoration: 'enabled',
				anchorScrolling: 'enabled'
			})
		),
		{ provide: TitleStrategy, useClass: SeoTitleStrategy },
		// fetch, not XHR: the server (Cloudflare Workers) has no XMLHttpRequest.
		provideHttpClient(
			withFetch(),
			withInterceptors([serverApiTimeoutInterceptor])
		),
		// Reuses the server-rendered HTML (and the API responses it fetched)
		// instead of rendering the page again in the browser.
		provideClientHydration(withEventReplay())
	]
};
