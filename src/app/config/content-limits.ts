// Mirrors the API's limits on what editors write (its
// src/config/content-limits.ts), in characters unless noted, so the tools can
// show them and stop text going over. The API's are the ones enforced.

export const MAX_NEWS_TITLE_LENGTH = 200;
export const MAX_NEWS_CONTENT_LENGTH = 20_000;
export const MAX_GALLERY_CAPTION_LENGTH = 300;
export const MAX_DOWNLOAD_TITLE_LENGTH = 100;
export const MAX_DOWNLOAD_DESCRIPTION_LENGTH = 1000;

/** A gallery or download collection's slug and title. */
export const MAX_COLLECTION_SLUG_LENGTH = 40;
export const MAX_COLLECTION_TITLE_LENGTH = 60;

/** Tags per gallery image, and each tag's length. */
export const MAX_TAGS_PER_IMAGE = 5;
export const MAX_TAG_LENGTH = 16;

/** Any URL: images, downloads, links. */
export const MAX_URL_LENGTH = 2000;

/** A map season's dimensions, and each dimension's text fields. */
export const MAX_MAP_DIMENSIONS = 10;
export const MAX_MAP_DIMENSION_NAME_LENGTH = 60;
export const MAX_MAP_WORLD_FIELD_LENGTH = 200;
