import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
	provideHttpClient,
	withInterceptorsFromDi
} from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { GalleryProviderService } from './app/services/gallery-provider.service';
import { MapProviderService } from './app/services/map-provider.service';
import { PaginatorIntlService } from './app/services/paginator-intl.service';

bootstrapApplication(AppComponent, {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(
			routes,
			withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
		),
		importProvidersFrom(
			BrowserAnimationsModule,
			MatButtonModule,
			MatPaginatorModule,
			MatIconModule
		),
		GalleryProviderService,
		MapProviderService,
		PaginatorIntlService,
		provideHttpClient(withInterceptorsFromDi())
	]
}).catch((err) => console.error(err));
