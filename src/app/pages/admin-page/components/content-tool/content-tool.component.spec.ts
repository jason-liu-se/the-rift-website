import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AUTOSAVE_DELAY_MS } from 'src/app/config/admin';
import { EditorNewsPost } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { ContentToolComponent } from './content-tool.component';
import { CollectionsStore } from '../../services/collections-store.service';

const EDITOR_URL = `${environment.API_URL}/editor`;
const POST: EditorNewsPost = {
	id: 'post-1',
	title: 'Published title',
	content: 'Body',
	date: '2026-01-01T12:00:00.000Z',
	status: 'live',
	visible: false,
	revision: 4
};

@Component({
	template: `<app-content-tool type="news" />`,
	imports: [ContentToolComponent]
})
class NewsToolHostComponent {}

describe('ContentToolComponent', () => {
	let harness: RouterTestingHarness;
	let httpTesting: HttpTestingController;
	let notifySuccess: ReturnType<typeof vi.fn>;

	const element = () => harness.routeNativeElement!;
	const heading = () => element().querySelector('h2')?.textContent?.trim();
	const button = (name: string) =>
		[...element().querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => candidate.textContent?.trim() === name
		)!;
	const url = () => TestBed.inject(Router).url;
	const titleInput = () =>
		[...element().querySelectorAll('input')].find((input) =>
			input.labels?.[0]?.textContent?.includes('Title')
		)!;
	/** Answers the list's requests, if it's showing. */
	const flushList = () => {
		httpTesting
			.match(
				({ url }) =>
					url === `${EDITOR_URL}/news` ||
					url === `${EDITOR_URL}/drafts`
			)
			.forEach((request) =>
				request.flush(
					request.request.url.endsWith('drafts')
						? []
						: { items: [], total: 0 }
				)
			);
	};

	afterEach(() => vi.useRealTimers());

	async function open(path: string) {
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(path);
		harness.detectChanges();
	}

	beforeEach(() => {
		localStorage.clear();
		notifySuccess = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				CollectionsStore,
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'admin', component: NewsToolHostComponent }
				]),
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: 'me', username: 'me' }) }
				},
				{
					provide: AdminNotifierService,
					useValue: {
						notifySuccess,
						notifyFailure: vi.fn(),
						notify: vi.fn()
					}
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	it("keeps the list's filters in the URL while an item is open", async () => {
		await open('/admin?status=hidden#news');
		flushList();

		button('New post').click();
		await harness.fixture.whenStable();
		expect(url()).toBe('/admin?status=hidden&new=#news');

		harness.detectChanges();
		button('Close').click();
		await harness.fixture.whenStable();
		expect(url()).toBe('/admin?status=hidden#news');
		harness.detectChanges();
		flushList();
	});

	it('opens a new item from the list, by URL', async () => {
		await open('/admin#news');
		flushList();

		button('New post').click();
		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(url()).toBe('/admin?new=#news');
		expect(heading()).toBe('New post');
	});

	it('gives a new draft its own URL once something is saved, then publishes it', async () => {
		vi.useFakeTimers({
			toFake: [
				'setTimeout',
				'clearTimeout',
				'setInterval',
				'clearInterval',
				'Date'
			]
		});
		await open('/admin?new#news');
		const input = titleInput();
		input.value = 'Hello';
		input.dispatchEvent(new Event('input'));
		harness.detectChanges();
		await vi.advanceTimersByTimeAsync(0);

		expect(url()).toMatch(/^\/admin\?draft=[\w-]+#news$/);
		const draftId = new URL(url(), 'http://x').searchParams.get('draft');
		expect(heading()).toBe('New post');

		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		httpTesting
			.expectOne(`${EDITOR_URL}/drafts/${draftId}`)
			.flush({ id: draftId, revision: 1, type: 'news', fields: {} });
		vi.useRealTimers();

		button('Publish').click();
		const publish = httpTesting.expectOne(
			`${EDITOR_URL}/drafts/${draftId}/publish`
		);
		expect(publish.request.body).toEqual({ visible: true, date: 'now' });
		publish.flush({ ...POST, title: 'Hello' });
		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(notifySuccess).toHaveBeenCalledWith('Published Hello.');
		expect(url()).toBe('/admin#news');
	});

	it('edits a published item from its fields, keeping its visibility and date', async () => {
		await open('/admin?edit=post-1#news');
		httpTesting.expectOne(`${EDITOR_URL}/news/post-1`).flush(POST);
		httpTesting.expectOne(`${EDITOR_URL}/drafts?type=news`).flush([]);
		await harness.fixture.whenStable();
		harness.detectChanges();
		await new Promise((resolve) => setTimeout(resolve));
		harness.detectChanges();

		expect(heading()).toBe('Editing Published title');
		expect(titleInput().value).toBe('Published title');
		expect(element().textContent).toContain('Keep its date');
		// Nothing changed, so no draft yet.
		expect(element().textContent).not.toContain('Unpublished changes');

		button('Close').click();
		await harness.fixture.whenStable();
		expect(url()).toBe('/admin#news');
		flushList();
	});
});
