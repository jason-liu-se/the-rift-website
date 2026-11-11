// Writes public/robots.txt and public/sitemap.xml for search engines, listing
// every route in src/app/app.routes.ts except those marked `noindex: true`
// (such as the catch-all 404 route). Called by scripts/environments/generate.mjs with the
// production site URL, so the files stay in step with the routes and .env.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ROUTES_FILE = "src/app/app.routes.ts";
const OUTPUT_DIR = "public";

/**
 * Paths of the indexable routes. Reads the routes file as text (it imports
 * Angular components, so Node can't import it), relying on each route being a
 * flat object literal that starts with a string literal `path`.
 */
function indexablePaths() {
	const source = readFileSync(ROUTES_FILE, "utf8");
	const routes = source.split(/\bpath:\s*/).slice(1);
	return routes
		.filter((route) => !/\bnoindex:\s*true/.test(route))
		.map((route) => {
			const path = route.match(/^(['"`])(.*?)\1/)?.[2];
			if (path === undefined) {
				throw new Error(
					`${ROUTES_FILE}: expected a string literal after "path:", got ${route.slice(0, 40)}`
				);
			}
			return path;
		});
}

/** Escapes text for an XML element. */
function escapeXml(text) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

/** Writes the files, with absolute URLs under `siteUrl` (no trailing slash). */
export function writeCrawlerFiles(siteUrl) {
	const urls = indexablePaths()
		.map(
			(path) =>
				`\t<url><loc>${escapeXml(`${siteUrl}/${path}`)}</loc></url>`
		)
		.join("\n");
	// public/ only holds these generated (gitignored) files, so it may not exist.
	mkdirSync(OUTPUT_DIR, { recursive: true });
	writeFileSync(
		`${OUTPUT_DIR}/sitemap.xml`,
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
	);
	writeFileSync(
		`${OUTPUT_DIR}/robots.txt`,
		`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
	);
}
