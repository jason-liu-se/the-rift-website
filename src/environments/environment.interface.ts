/** Build-specific settings, generated from `.env` by scripts/generate-environments.mjs. */
export interface IEnvironment {
	/** Base URL of The Rift API (news, gallery, downloads). */
	readonly apiEndpoint: string;
	/** Base URL of the BlueMap server embedded on the map pages. */
	readonly bluemapUrl: string;
}
