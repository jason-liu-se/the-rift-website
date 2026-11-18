import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { GalleryProviderService } from '../services/gallery-provider/gallery-provider.service';

/**
 * Matches `gallery/:collection` only for a collection the API lists, so any
 * other name falls through to the 404 page. If the API is down, it matches and
 * the page shows its own error state.
 */
export const requireGalleryCollection: CanMatchFn = (_route, segments) =>
	inject(GalleryProviderService)
		.getCollectionNamesObservable()
		.pipe(
			map((names) => names.includes(segments[1]?.path)),
			catchError(() => of(true))
		);
