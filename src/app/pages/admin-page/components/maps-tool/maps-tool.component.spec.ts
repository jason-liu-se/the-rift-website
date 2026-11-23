import { LiveAnnouncer } from '@angular/cdk/a11y';
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
import { EDITOR_MAP_SEASONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { MapsToolComponent } from './maps-tool.component';

const EDITOR_URL = `${environment.API_URL}/editor`;

describe('MapsToolComponent', () => {
	let harness: RouterTestingHarness;
	let announce: ReturnType<typeof vi.fn>;
	const element = () => harness.routeNativeElement!;
	const legends = () =>
		[...element().querySelectorAll('.dimension legend')].map((legend) =>
			legend.textContent?.trim()
		);
	const button = (name: string) =>
		[...element().querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) =>
				candidate.textContent?.replace(/\s+/g, ' ').trim() === name
		)!;
	const click = (name: string) => {
		button(name).click();
		harness.detectChanges();
	};

	async function open(url: string) {
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(url);
		harness.detectChanges();
	}

	beforeEach(() => {
		localStorage.clear();
		announce = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'admin', component: MapsToolComponent }
				]),
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{ provide: LiveAnnouncer, useValue: { announce } },
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				}
			]
		});
	});

	it('lists seasons with how many dimensions each has', async () => {
		await open('/admin#maps');
		const http = TestBed.inject(HttpTestingController);
		http.expectOne(
			`${EDITOR_URL}/maps/seasons?startIndex=0&limit=25`
		).flush({ items: EDITOR_MAP_SEASONS, total: 1 });
		http.expectOne(`${EDITOR_URL}/drafts?type=maps`).flush([]);
		harness.detectChanges();

		expect(
			element()
				.querySelector('td.item')
				?.textContent?.replace(/\s+/g, ' ')
				.trim()
		).toBe('Season 5 3 dimensions');
	});

	it('starts a new season with the default dimensions, which are no change yet', async () => {
		await open('/admin?new#maps');

		expect(legends()).toEqual(['1. Overworld', '2. Nether', '3. End']);
		expect(element().textContent).not.toContain('Unpublished changes');
	});

	it('reorders dimensions by button, announcing each move', async () => {
		await open('/admin?new#maps');

		click('Move down Overworld');

		expect(legends()).toEqual(['1. Nether', '2. Overworld', '3. End']);
		expect(announce).toHaveBeenCalledWith(
			'Moved Overworld to position 2 of 3.'
		);
		expect(button('Move up Nether').disabled).toBe(true);
	});

	it('adds and removes dimensions', async () => {
		await open('/admin?new#maps');

		click('Remove End');
		click('Add a dimension');

		expect(legends()).toEqual([
			'1. Overworld',
			'2. Nether',
			'3. dimension 3'
		]);
		expect(announce).toHaveBeenCalledWith('Removed End.');
	});
});
