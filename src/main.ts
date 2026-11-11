import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
	TitleStrategy,
	provideRouter,
	withInMemoryScrolling
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { SeoTitleStrategy } from './app/seo/seo-title-strategy';

bootstrapApplication(AppComponent, {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(
			routes,
			withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
		),
		{ provide: TitleStrategy, useClass: SeoTitleStrategy },
		provideHttpClient()
	]
}).catch((err) => console.error(err));
