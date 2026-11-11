import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
	TitleStrategy,
	provideRouter,
	withInMemoryScrolling
} from '@angular/router';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './seo/seo-title-strategy';

/** App-wide providers, shared by the browser and server builds. */
export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(
			routes,
			withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
		),
		{ provide: TitleStrategy, useClass: SeoTitleStrategy },
		provideHttpClient()
	]
};
