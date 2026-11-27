/** Keeps the admin pages out of search results, even for crawlers that don't run JavaScript. */
export const NOINDEX_HEADERS = { 'X-Robots-Tag': 'noindex' };

/** Items per page in an admin tool's list: the API's most (MAX_EDITOR_PAGE_SIZE). */
export const EDITOR_PAGE_SIZE = 25;

/** The most items one bulk request may act on: the API's MAX_BULK_ITEMS. */
export const MAX_BULK_ITEMS = 50;

/** How long after typing stops a list search is sent. */
export const EDITOR_SEARCH_DEBOUNCE_MS = 300;

/** How long a success snackbar stays; failures stay until dismissed. */
export const SNACKBAR_SUCCESS_DURATION_MS = 4000;

/** How long a snackbar offering Undo stays: long enough to reach it. */
export const SNACKBAR_UNDO_DURATION_MS = 8000;

/**
 * How long after typing stops a draft autosaves to the server. At most one
 * save per pause keeps an editor well under the API's write limit (15 per 15
 * seconds), leaving room for uploads and other writes.
 */
export const AUTOSAVE_DELAY_MS = 3000;

/** Changes this close together are one step for undo (typing a word). */
export const UNDO_GROUP_MS = 1000;
