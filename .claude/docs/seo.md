# SEO

- **Titles and meta tags.** `SeoTitleStrategy` (`src/app/seo/`) runs after each
  navigation and sets:
    - the title: the route's `title` plus " | The Rift"
    - the meta description: `data.description`, falling back to the site-wide
      one in `src/index.html`
    - the canonical URL, Open Graph tags, and the site's structured data

    Give every route a unique `title` (page first) and a `data.description`.
    Routes with `data.noindex: true`, like the 404 page, get `robots: noindex`
    and no canonical URL.

- **Crawler files.** `npm run env` writes `public/robots.txt` and
  `public/sitemap.xml` (gitignored) from the routes and the production
  `SITE_URL` (`scripts/seo/crawler-files.mjs`). New routes are added
  automatically unless marked `noindex`.
- **Status codes.** Unknown URLs return the 404 page with a 404 status (see
  [rendering.md](./rendering.md)).
- **Page content.** See the SEO section of [ui-standards.md](./ui-standards.md).
