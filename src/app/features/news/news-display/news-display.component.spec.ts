import { TestBed } from '@angular/core/testing';

import { NewsPost } from 'src/app/core/api/api-responses';
import { renderComponent } from 'src/app/testing/render-component';
import { NewsDisplayComponent } from './news-display.component';

const NEWS_POSTS: NewsPost[] = [
	{
		id: '1',
		title: 'Season 6',
		date: '2026-01-02T12:00:00',
		content: 'A new season begins.',
		imageUrl: 'assets/season-6.png'
	},
	{
		id: '2',
		title: 'Maintenance',
		date: '2026-03-04T12:00:00',
		content: 'Downtime.',
		editedAt: '2026-03-05T12:00:00'
	},
	{
		id: '3',
		title: 'Build *contest*',
		date: '2026-05-06T12:00:00',
		content: 'Enter the **build contest**.\n\n- Theme: spawn',
		imageUrl: ''
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
		expect(posts[0].querySelector('.date')?.textContent?.trim()).toBe(
			'Fri Jan 02 2026'
		);
		expect(posts[0].querySelector('.content')?.textContent?.trim()).toBe(
			'A new season begins.'
		);
	});

	it('renders titles and content as markdown', () => {
		expect(posts[2].querySelector('h2 em')?.textContent).toBe('contest');
		expect(posts[2].querySelector('h2 p')).toBeNull();
		expect(posts[2].querySelector('.content strong')?.textContent).toBe(
			'build contest'
		);
		expect(posts[2].querySelector('.content li')?.textContent).toBe(
			'Theme: spawn'
		);
	});

	it('says when a post was edited, only if it was', () => {
		const edited = posts[1].querySelector('.edited time');
		expect(edited?.textContent).toBe('Edited Thu Mar 05 2026');
		expect(edited?.getAttribute('datetime')).toBe(NEWS_POSTS[1].editedAt);
		expect(posts[0].querySelector('.edited')).toBeNull();
	});

	it('shows a banner image only when the item has one', () => {
		expect(posts[0].querySelector('.banner img')?.getAttribute('src')).toBe(
			'assets/season-6.png'
		);
		expect(posts[1].querySelector('.banner img')).toBeNull();
		expect(posts[2].querySelector('.banner img')).toBeNull();
	});
});
