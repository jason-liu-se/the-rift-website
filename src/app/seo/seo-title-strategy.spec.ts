import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { environment } from 'src/environments/environment';

import { SeoTitleStrategy } from './seo-title-strategy';

@Component({ template: '' })
class StubPageComponent {}

const DEFAULT_DESCRIPTION = 'Site-wide description';

describe('SeoTitleStrategy', () => {
	let router: Router;
	let defaultTag: HTMLMetaElement;

	beforeEach(() => {
		// Stands in for the site-wide description in index.html.
		defaultTag = document.createElement('meta');
		defaultTag.name = 'description';
		defaultTag.content = DEFAULT_DESCRIPTION;
		document.head.appendChild(defaultTag);

		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{
						path: 'news',
						component: StubPageComponent,
						title: 'News',
						data: { description: 'The latest news.' }
					},
					{ path: 'plain', component: StubPageComponent },
					{
						path: '**',
						component: StubPageComponent,
						title: 'Page Not Found',
						data: { noindex: true }
					}
				]),
				{ provide: TitleStrategy, useClass: SeoTitleStrategy }
			]
		});
		router = TestBed.inject(Router);
	});

	afterEach(() => {
		document.head
			.querySelectorAll(
				'meta[name="description"], meta[name="robots"], meta[property^="og:"], link[rel="canonical"], script[type="application/ld+json"]'
			)
			.forEach((element) => element.remove());
	});

	const metaContent = (selector: string) =>
		document.head.querySelector<HTMLMetaElement>(`meta[${selector}]`)
			?.content;
	const canonical = () =>
		document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

	it('sets the title, description and share tags from the route', async () => {
		await router.navigateByUrl('/news?page=2#top');

		expect(document.title).toBe('News | The Rift');
		expect(metaContent('name="description"')).toBe('The latest news.');
		expect(metaContent('property="og:title"')).toBe('News | The Rift');
		expect(metaContent('property="og:description"')).toBe(
			'The latest news.'
		);
		expect(metaContent('property="og:url"')).toBe(
			`${environment.SITE_URL}/news`
		);
		expect(canonical()?.href).toBe(`${environment.SITE_URL}/news`);
		expect(metaContent('name="robots"')).toBeUndefined();
	});

	it('falls back to the site name and default description', async () => {
		await router.navigateByUrl('/plain');

		expect(document.title).toBe('The Rift');
		expect(metaContent('name="description"')).toBe(DEFAULT_DESCRIPTION);
	});

	it('marks noindex pages and drops their canonical URL', async () => {
		await router.navigateByUrl('/news');
		await router.navigateByUrl('/missing');

		expect(document.title).toBe('Page Not Found | The Rift');
		expect(metaContent('name="robots"')).toBe('noindex');
		expect(canonical()).toBeNull();
	});

	it('adds the site structured data once', async () => {
		await router.navigateByUrl('/news');
		await router.navigateByUrl('/plain');

		const scripts = document.head.querySelectorAll(
			'script[type="application/ld+json"]'
		);
		expect(scripts).toHaveLength(1);
		expect(JSON.parse(scripts[0].textContent!)['@graph'][0]).toEqual({
			'@type': 'WebSite',
			name: 'The Rift',
			url: `${environment.SITE_URL}/`
		});
	});
});
