import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BulkItemResult } from 'src/app/core/api/api-responses';
import { environment } from 'src/environments/environment';
import { BulkActionRunnerService } from './bulk-action-runner.service';

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

	it('splits a selection into requests of at most 50, one after another, and answers every result once done', () => {
		let results: BulkItemResult<unknown>[] | undefined;
		runner
			.run('news', { action: 'hide' }, refs(120))
			.subscribe((all) => (results = all));

		const sizes: number[] = [];
		for (const expected of [50, 50, 20]) {
			expect(results).toBeUndefined();
			const request = httpTesting.expectOne(`${NEWS_URL}/bulk`);
			expect(request.request.method).toBe('PATCH');
			expect(request.request.withCredentials).toBe(true);
			expect(request.request.body.action).toBe('hide');
			sizes.push(request.request.body.items.length);
			request.flush(okResults(expected));
		}

		expect(sizes).toEqual([50, 50, 20]);
		expect(results).toHaveLength(120);
	});

	it('deletes with DELETE and the items in the body', () => {
		runner.run('news', { action: 'delete' }, refs(2)).subscribe();

		const request = httpTesting.expectOne(`${NEWS_URL}/bulk`);
		expect(request.request.method).toBe('DELETE');
		expect(request.request.body).toEqual({ items: refs(2) });
		request.flush(okResults(2));
	});

	it("counts a failed request's items as invalid, and carries on with the next", () => {
		let results: BulkItemResult<unknown>[] = [];
		runner
			.run('news', { action: 'show' }, refs(60))
			.subscribe((all) => (results = all));

		httpTesting
			.expectOne(`${NEWS_URL}/bulk`)
			.flush(null, { status: 500, statusText: 'Server Error' });
		httpTesting.expectOne(`${NEWS_URL}/bulk`).flush(okResults(10));

		expect(results).toHaveLength(60);
		expect(results[0]).toEqual({
			id: 'id-0',
			outcome: 'invalid',
			reason: 'The server failed. Try again.'
		});
		expect(results.filter(({ outcome }) => outcome === 'ok')).toHaveLength(
			10
		);
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
		expect((all as unknown[])[0]).toEqual({ id: 'id-0-0', revision: 7 });
	});
});
