import { TestBed } from '@angular/core/testing';

import { NewsPost } from 'src/app/interfaces/api-responses';
import { renderComponent } from 'src/app/testing/render-component';
import { NewsDisplayComponent } from './news-display.component';

const NEWS_POSTS: NewsPost[] = [
	{
		id: '1',
		title: 'Season 6',
		date: '2026-01-02T12:00:00',
		content: 'A new season begins.',
		bannerImg: 'assets/season-6.png'
	},
	{
		id: '2',
		title: 'Maintenance',
		date: '2026-03-04T12:00:00',
		content: 'Downtime.'
	},
	{
		id: '3',
		title: 'Event',
		date: '2026-05-06T12:00:00',
		content: 'Build contest.',
		bannerImg: ''
	}
];

describe('NewsDisplayComponent', () => {
	let posts: NodeListOf<HTMLElement>;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [NewsDisplayComponent] });
		posts = renderComponent(NewsDisplayComponent, {
			newsPosts: NEWS_POSTS
		}).nativeElement.querySelectorAll('.news-post');
	});

	it('renders each post with its title, date and content', () => {
		expect(posts).toHaveLength(NEWS_POSTS.length);
		expect(posts[0].querySelector('h2')?.textContent).toBe('Season 6');
		expect(posts[0].querySelector('.date')?.textContent).toBe(
			'Fri Jan 02 2026'
		);
		expect(posts[0].querySelector('.content')?.textContent).toBe(
			'A new season begins.'
		);
	});

	it('shows a banner image only when the item has one', () => {
		expect(posts[0].querySelector('.banner img')?.getAttribute('src')).toBe(
			'assets/season-6.png'
		);
		expect(posts[1].querySelector('.banner img')).toBeNull();
		expect(posts[2].querySelector('.banner img')).toBeNull();
	});
});
