import { unversioned } from '../content-version/content-version.service';

/**
 * Options for every `/editor/*` request: the session cookies (so
 * authRefreshInterceptor renews an expired login), and never the content
 * version, since the API doesn't cache logged-in reads.
 */
export const EDITOR_REQUEST_OPTIONS = {
	withCredentials: true,
	context: unversioned()
};
