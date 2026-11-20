/** How long a server render waits for each API response before giving up. */
export const SERVER_API_TIMEOUT_MS = 5000;

/**
 * How long the browser keeps the content version before fetching it again, so
 * a long-open tab picks up edits instead of reading content cached under the
 * old version. Matches the API's browser cache time for versioned reads.
 */
export const CONTENT_VERSION_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * How often the browser checks whether the API is back while it is down (and
 * the tab is visible), and how long each check may take.
 */
export const API_HEALTH_CHECK_INTERVAL_MS = 15 * 1000;
