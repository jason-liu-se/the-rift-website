import { Observable } from 'rxjs';

/** A shared request and when it started. */
export interface TimedRequest<T> {
	response$: Observable<T>;
	startedAt: number;
}

/**
 * Keeps `latest` until it's older than `maxAgeMs`, else starts `fetch` again.
 * Its age is checked on use rather than with a timer, which would keep the app
 * from becoming stable (holding up server rendering and hydration). Share the
 * response with `shareReplay(1)`: it doesn't replay errors, so a failed fetch
 * is made again by the next subscriber.
 */
export function reuseUntilOld<T>(
	latest: TimedRequest<T> | undefined,
	maxAgeMs: number,
	fetch: () => Observable<T>
): TimedRequest<T> {
	const now = Date.now();
	if (latest && now - latest.startedAt <= maxAgeMs) {
		return latest;
	}
	return { response$: fetch(), startedAt: now };
}
