import { IMAGE_LOADER } from '@angular/common';
import {
	provideHttpClient,
	withFetch,
	withInterceptors
} from '@angular/common/http';
import {
	ApplicationConfig,
	isDevMode,
	provideZoneChangeDetection
} from '@angular/core';
import {
	provideClientHydration,
	withEventReplay
} from '@angular/platform-browser';
import {
	TitleStrategy,
	provideRouter,
	withComponentInputBinding,
	withInMemoryScrolling
} from '@angular/router';

import { routes } from './app.routes';
import {
	cloudflareImageLoader,
	originalImageLoader
} from './shared/utils/image-loaders';
import { SeoTitleStrategy } from './core/seo/seo-title-strategy';
import { apiStatusInterceptor } from './core/api/api-status/api-status.interceptor';
import { authRefreshInterceptor } from './core/auth/auth-refresh.interceptor';
import { contentVersionInterceptor } from './core/api/content-version/content-version.interceptor';
import { serverApiTimeoutInterceptor } from './core/api/server-api-timeout/server-api-timeout.interceptor';

/** App-wide providers, shared by the browser and server builds. */
export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(
			routes,
			// Routed components (e.g. the admin tools) get route parameters as inputs.
			withComponentInputBinding(),
			// A fragment change scrolls to the matching id, if any, instead of to
			// the top.
			withInMemoryScrolling({
				scrollPositionRestoration: 'enabled',
				anchorScrolling: 'enabled'
			})
		),
		{ provide: TitleStrategy, useClass: SeoTitleStrategy },
		// fetch, not XHR: the server (Cloudflare Workers) has no XMLHttpRequest.
		provideHttpClient(
			withFetch(),
			withInterceptors([
				serverApiTimeoutInterceptor,
				apiStatusInterceptor,
				contentVersionInterceptor,
				authRefreshInterceptor
			])
		),
		// Reuses the server-rendered HTML (and the API responses it fetched)
		// instead of rendering the page again in the browser.
		provideClientHydration(withEventReplay()),
		// Resized images for OptimizedImage. Development servers
		// have no Cloudflare image transformations, so they get the originals.
		{
			provide: IMAGE_LOADER,
			useFactory: () =>
				isDevMode() ? originalImageLoader : cloudflareImageLoader
		}
	]
};
