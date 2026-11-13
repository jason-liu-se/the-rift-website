import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
	ActivatedRouteSnapshot,
	RouterStateSnapshot,
	TitleStrategy
} from '@angular/router';
import { LOGO_PATH, SHARE_IMAGE_PATH, SITE_NAME } from '../config/site';
import { environment } from 'src/environments/environment';

const STRUCTURED_DATA_ID = 'site-structured-data';

/**
 * Sets the page title and the tags search engines and link previews read
 * (description, canonical URL, Open Graph, robots) after each navigation, from
 * the active route's `title` and `data['description']`/`data['noindex']`.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
	private readonly title = inject(Title);
	private readonly meta = inject(Meta);
	private readonly document = inject(DOCUMENT);
	/** The site-wide description in index.html, for pages without their own. */
	private readonly defaultDescription =
		this.meta.getTag('name="description"')?.content ?? '';

	override updateTitle(snapshot: RouterStateSnapshot): void {
		const pageTitle = this.buildTitle(snapshot);
		const title = pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;
		const data = deepestChild(snapshot.root).data;
		const description: string =
			data['description'] ?? this.defaultDescription;
		const url = siteUrl(snapshot.url.split(/[?#]/)[0]);

		this.title.setTitle(title);
		this.meta.updateTag({ name: 'description', content: description });
		this.meta.updateTag({ property: 'og:title', content: title });
		this.meta.updateTag({
			property: 'og:description',
			content: description
		});
		this.meta.updateTag({ property: 'og:url', content: url });
		this.meta.updateTag({
			property: 'og:image',
			content: siteUrl(SHARE_IMAGE_PATH)
		});

		// Error pages stay out of search results and have no canonical URL.
		if (data['noindex']) {
			this.meta.updateTag({ name: 'robots', content: 'noindex' });
			this.setCanonicalUrl(null);
		} else {
			this.meta.removeTag('name="robots"');
			this.setCanonicalUrl(url);
		}
		this.setStructuredData();
	}

	private setCanonicalUrl(url: string | null): void {
		let link = this.document.head.querySelector<HTMLLinkElement>(
			'link[rel="canonical"]'
		);
		if (!url) {
			link?.remove();
			return;
		}
		if (!link) {
			link = this.document.createElement('link');
			link.rel = 'canonical';
			this.document.head.appendChild(link);
		}
		link.href = url;
	}

	/** Adds the site's name, URL and logo for search results (once). */
	private setStructuredData(): void {
		if (this.document.getElementById(STRUCTURED_DATA_ID)) {
			return;
		}
		const script = this.document.createElement('script');
		script.id = STRUCTURED_DATA_ID;
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{ '@type': 'WebSite', name: SITE_NAME, url: siteUrl('/') },
				{
					'@type': 'Organization',
					name: SITE_NAME,
					url: siteUrl('/'),
					logo: siteUrl(LOGO_PATH)
				}
			]
		});
		this.document.head.appendChild(script);
	}
}

function deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
	return route.firstChild ? deepestChild(route.firstChild) : route;
}

/** Absolute URL on the public site for a root-relative `path`. */
function siteUrl(path: string): string {
	return `${environment.SITE_URL}${path}`;
}
