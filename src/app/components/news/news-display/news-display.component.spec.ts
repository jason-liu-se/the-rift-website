import { TestBed } from '@angular/core/testing';

import { INewsItem } from 'src/app/interfaces/news-item.interface';
import { renderComponent } from 'src/app/testing/render-component';
import { NewsDisplayComponent } from './news-display.component';

const NEWS_ITEMS: INewsItem[] = [
	{
		title: 'Season 6',
		date: '2026-01-02T12:00:00',
		content: 'A new season begins.',
		bannerImg: 'assets/season-6.png'
	},
	{ title: 'Maintenance', date: '2026-03-04T12:00:00', content: 'Downtime.' },
	{
		title: 'Event',
		date: '2026-05-06T12:00:00',
		content: 'Build contest.',
		bannerImg: ''
	}
];

describe('NewsDisplayComponent', () => {
	let items: NodeListOf<HTMLElement>;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [NewsDisplayComponent] });
		items = renderComponent(NewsDisplayComponent, {
			newsItems: NEWS_ITEMS
		}).nativeElement.querySelectorAll('.news-item');
	});

	it('renders each item with its title, date and content', () => {
		expect(items).toHaveLength(NEWS_ITEMS.length);
		expect(items[0].querySelector('h2')?.textContent).toBe('Season 6');
		expect(items[0].querySelector('.date')?.textContent).toBe(
			'Fri Jan 02 2026'
		);
		expect(items[0].querySelector('.content')?.textContent).toBe(
			'A new season begins.'
		);
	});

	it('shows a banner image only when the item has one', () => {
		expect(items[0].querySelector('.banner-img')?.getAttribute('src')).toBe(
			'assets/season-6.png'
		);
		expect(items[1].querySelector('.banner-img')).toBeNull();
		expect(items[2].querySelector('.banner-img')).toBeNull();
	});
});
