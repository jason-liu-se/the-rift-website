import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BulkItemResult } from 'src/app/interfaces/api-responses';
import { environment } from 'src/environments/environment';
import { BulkSummary } from './bulk-results';
import { BulkActionRunnerService } from './bulk-action-runner.service';

const NOUN = { one: 'post', many: 'posts' };
const NEWS_URL = `${environment.API_URL}/editor/news`;
const refs = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: `id-${i}`,
		startingRevision: i
	}));
const okResults = (count: number): { results: BulkItemResult<unknown>[] } => ({
	results: refs(count).map(({ id }) => ({ id, outcome: 'ok' }))
});

describe('BulkActionRunnerService', () => {
	let runner: BulkActionRunnerService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		runner = TestBed.inject(BulkActionRunnerService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('splits a selection into requests of at most 50, one after another, with one summary each', () => {
		const summaries: BulkSummary[] = [];
		runner
			.run('news', { action: 'hide' }, refs(120), NOUN)
			.subscribe((summary) => summaries.push(summary));

		const sizes: number[] = [];
		for (const expected of [50, 50, 20]) {
			const request = httpTesting.expectOne(`${NEWS_URL}/bulk`);
			expect(request.request.method).toBe('PATCH');
			expect(request.request.withCredentials).toBe(true);
			expect(request.request.body.action).toBe('hide');
			sizes.push(request.request.body.items.length);
			request.flush(okResults(expected));
		}

		expect(sizes).toEqual([50, 50, 20]);
		expect(summaries.map(({ message }) => message)).toEqual([
			'Hid 50 posts.',
			'Hid 50 posts.',
			'Hid 20 posts.'
		]);
	});

	it('deletes with DELETE and the items in the body', () => {
		runner.run('news', { action: 'delete' }, refs(2), NOUN).subscribe();

		const request = httpTesting.expectOne(`${NEWS_URL}/bulk`);
		expect(request.request.method).toBe('DELETE');
		expect(request.request.body).toEqual({ items: refs(2) });
		request.flush(okResults(2));
	});

	it('reports a failed request and carries on with the next', () => {
		const summaries: BulkSummary[] = [];
		runner
			.run('news', { action: 'show' }, refs(60), NOUN)
			.subscribe((summary) => summaries.push(summary));

		httpTesting
			.expectOne(`${NEWS_URL}/bulk`)
			.flush(null, { status: 500, statusText: 'Server Error' });
		httpTesting.expectOne(`${NEWS_URL}/bulk`).flush(okResults(10));

		expect(summaries).toEqual([
			{ message: 'The server failed. Try again.', hasFailures: true },
			{ message: 'Made visible 10 posts.', hasFailures: false }
		]);
	});

	it('fetches every page matching the filters', () => {
		let all: unknown;
		runner
			.fetchAllMatching('news', { status: 'hidden' })
			.subscribe((matching) => (all = matching));

		const page = (start: number, count: number) => ({
			items: refs(count).map(({ id }) => ({
				id: `${id}-${start}`,
				revision: 7
			})),
			total: 30
		});
		httpTesting
			.expectOne(`${NEWS_URL}?status=hidden&startIndex=0&limit=25`)
			.flush(page(0, 25));
		httpTesting
			.expectOne(`${NEWS_URL}?status=hidden&startIndex=25&limit=25`)
			.flush(page(25, 5));

		expect(all).toHaveLength(30);
		expect((all as unknown[])[0]).toEqual({
			id: 'id-0-0',
			startingRevision: 7
		});
	});
});
