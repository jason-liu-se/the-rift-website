import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { renderComponent } from 'src/app/testing/render-component';
import { NewsToolComponent } from './news-tool.component';

describe('NewsToolComponent', () => {
	it('previews a sample post with the news page component', () => {
		TestBed.configureTestingModule({
			imports: [NewsToolComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([])
			]
		});
		const fixture = renderComponent(NewsToolComponent);
		const post = fixture.nativeElement.querySelector(
			'app-news-display .title'
		);
		expect(post?.textContent).toBe(fixture.componentInstance.preview.title);
		// Sample data can't be tabbed into or used.
		expect(post.closest('[inert]')).not.toBeNull();
	});
});
