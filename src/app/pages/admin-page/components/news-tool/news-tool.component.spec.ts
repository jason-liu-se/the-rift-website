import { TestBed } from '@angular/core/testing';
import { renderComponent } from 'src/app/testing/render-component';
import { NewsToolComponent } from './news-tool.component';

describe('NewsToolComponent', () => {
	it('previews a sample post with the news page component', () => {
		TestBed.configureTestingModule({ imports: [NewsToolComponent] });
		const fixture = renderComponent(NewsToolComponent);
		const post = fixture.nativeElement.querySelector(
			'app-news-display .title'
		);
		expect(post?.textContent).toBe(fixture.componentInstance.preview.title);
	});
});
