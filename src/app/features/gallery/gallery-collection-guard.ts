import { inject } from '@angular/core';
import { CanMatchFn, ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { GalleryApi } from './gallery-api';

/**
 * Matches `gallery/:collection` only for a collection the API lists, so any
 * other slug falls through to the 404 page. If the API is down, it matches and
 * the page shows its own error state.
 */
export const requireGalleryCollection: CanMatchFn = (_route, segments) =>
	inject(GalleryApi)
		.findCollectionTitle(segments[1]?.path)
		.pipe(
			map((title) => title !== undefined),
			catchError(() => of(true))
		);

/**
 * A resolver for text built from the gallery's title (the page title, its
 * description). If the API is down (the guard let the route match anyway),
 * the slug stands in for the title.
 */
export const resolveFromGalleryTitle =
	(toText: (title: string) => string): ResolveFn<string> =>
	(route) => {
		const slug: string = route.params['collection'];
		return inject(GalleryApi)
			.findCollectionTitle(slug)
			.pipe(
				map((title) => toText(title ?? slug)),
				catchError(() => of(toText(slug)))
			);
	};
