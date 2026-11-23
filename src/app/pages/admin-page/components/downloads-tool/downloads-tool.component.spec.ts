import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import {
	EDITOR_DOWNLOAD_COLLECTIONS,
	EDITOR_DOWNLOAD_ITEMS
} from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { DownloadsToolComponent } from './downloads-tool.component';

const EDITOR_URL = `${environment.API_URL}/editor`;

describe('DownloadsToolComponent', () => {
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
					{ path: 'admin', component: DownloadsToolComponent }
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

	it('lists downloads with their collection and sort order', async () => {
		await open('/admin#downloads');
		httpTesting
			.expectOne(`${EDITOR_URL}/downloads/items?startIndex=0&limit=25`)
			.flush({
				items: [{ ...EDITOR_DOWNLOAD_ITEMS[0], sortOrder: 2 }],
				total: 1
			});
		httpTesting.expectOne(`${EDITOR_URL}/drafts?type=downloads`).flush([]);
		httpTesting
			.expectOne(`${EDITOR_URL}/downloads/collections`)
			.flush(EDITOR_DOWNLOAD_COLLECTIONS);
		harness.detectChanges();

		expect(
			element()
				.querySelector('td.item')
				?.textContent?.replace(/\s+/g, ' ')
				.trim()
		).toBe('World download season5 · #2');
	});

	it('previews a new download as the downloads page shows it, and clears its sort order', async () => {
		await open('/admin?new#downloads');
		httpTesting
			.expectOne(`${EDITOR_URL}/downloads/collections`)
			.flush(EDITOR_DOWNLOAD_COLLECTIONS);
		const input = (label: string) =>
			[
				...element().querySelectorAll<HTMLInputElement>(
					'input, textarea'
				)
			].find(
				(candidate) =>
					candidate
						.closest('mat-form-field')
						?.querySelector('mat-label')
						?.textContent?.trim() === label
			)!;
		const type = (label: string, value: string) => {
			input(label).value = value;
			input(label).dispatchEvent(new Event('input'));
			harness.detectChanges();
		};

		type('Title', 'Season 7 world');
		type('Sort order', '3');
		type('Sort order', '');

		expect(
			element().querySelector('.preview app-download-card')?.textContent
		).toContain('Season 7 world');
		const session = (
			harness.routeDebugElement!.query(
				(node) => node.name === 'app-downloads-form'
			).componentInstance as { session(): { fields(): object } }
		).session();
		expect(session.fields()).toEqual({
			title: 'Season 7 world',
			sortOrder: null
		});
	});
});
