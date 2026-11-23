import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EDITOR_NEWS_POSTS } from 'src/app/testing/api-fixtures';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { NewsToolComponent } from './news-tool.component';

const EDITOR_URL = `${environment.API_URL}/editor`;

describe('NewsToolComponent', () => {
	let harness: RouterTestingHarness;
	let httpTesting: HttpTestingController;
	const element = () => harness.routeNativeElement!;

	async function open(url: string) {
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(url);
		harness.detectChanges();
	}

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'admin', component: NewsToolComponent }
				]),
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	it('lists posts with their markdown title and when they go or went live', async () => {
		await open('/admin#news');
		httpTesting
			.expectOne(`${EDITOR_URL}/news?startIndex=0&limit=25`)
			.flush({
				items: [
					{ ...EDITOR_NEWS_POSTS[0], title: 'Season *6*' },
					EDITOR_NEWS_POSTS.at(-1)
				],
				total: 2
			});
		httpTesting.expectOne(`${EDITOR_URL}/drafts?type=news`).flush([]);
		harness.detectChanges();

		const cells = [...element().querySelectorAll('td.item')].map((cell) =>
			cell.textContent?.replace(/\s+/g, ' ').trim()
		);
		expect(element().querySelector('td.item em')?.textContent).toBe('6');
		expect(cells[0]).toMatch(/^Season 6 Posted .+ · Edited /);
		expect(cells[1]).toMatch(/^Coming soon Goes live /);
	});

	it('previews a new post as the news page shows it', async () => {
		await open('/admin?new#news');
		const title =
			element().querySelector<HTMLInputElement>('input[required]')!;

		title.value = 'Hello **world**';
		title.dispatchEvent(new Event('input'));
		harness.detectChanges();

		const preview = element().querySelector('.preview app-news-display');
		expect(preview?.querySelector('h2 strong')?.textContent).toBe('world');
		expect(preview?.closest('[inert]')).not.toBeNull();
	});
});
