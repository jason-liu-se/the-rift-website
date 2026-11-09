// Settings for the environment variables (see README "Environment variables").
// Variables themselves go in .env; a new one needs no change here unless it
// needs checking or a development default. Keys are code names: PUBLIC_X,
// DEV_PUBLIC_X and PROD_PUBLIC_X all configure X.
import { normaliseUrl } from "./processors.mjs";

/** Checks or transforms a variable's value; see processors.mjs. */
export const PROCESSORS = {
	API_URL: normaliseUrl,
	BLUEMAP_URL: normaliseUrl
};

/** Development values used when .env doesn't set them, so a fresh clone works. */
export const DEV_DEFAULTS = {
	API_URL: "http://localhost:4000",
	BLUEMAP_URL: "http://localhost:8100"
};
