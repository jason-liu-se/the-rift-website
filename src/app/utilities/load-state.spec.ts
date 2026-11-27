import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiStatusService } from '../core/api/api-status/api-status.service';
import { LoadState } from './load-state';

describe('LoadState', () => {
	const retry = vi.fn();
	const create = () =>
		TestBed.runInInjectionContext(() => new LoadState(retry));

	beforeEach(() => {
		retry.mockClear();
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
	});

	/** The API goes down and comes back, as health checks would report. */
	function recoverApi(): void {
		const apiStatus = TestBed.inject(ApiStatusService);
		apiStatus.reportDown();
		TestBed.tick();
		apiStatus.reportUp();
		TestBed.tick();
	}

	it('shows a failure, marks a retry in flight, and clears on success', () => {
		const state = create();

		state.start();
		expect(state.failed()).toBe(false);
		expect(state.retrying()).toBe(false);

		state.fail();
		expect(state.failed()).toBe(true);

		state.start();
		expect(state.failed()).toBe(true);
		expect(state.retrying()).toBe(true);

		state.fail();
		expect(state.retrying()).toBe(false);

		state.start();
		state.succeed();
		expect(state.failed()).toBe(false);
		expect(state.retrying()).toBe(false);
	});

	it('never shows a failure on the server, so the browser can fetch after hydration', () => {
		TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
		const state = create();

		state.fail();

		expect(state.failed()).toBe(false);
	});

	describe('when the API comes back', () => {
		it('retries once if the request failed', () => {
			const state = create();
			state.fail();
			recoverApi();

			expect(retry).toHaveBeenCalledTimes(1);
		});

		it('retries once per recovery', () => {
			const state = create();
			state.fail();
			recoverApi();
			recoverApi();

			expect(retry).toHaveBeenCalledTimes(2);
		});

		it('does not retry when nothing failed', () => {
			create();
			recoverApi();

			expect(retry).not.toHaveBeenCalled();
		});

		it('does not retry when the request already succeeded again', () => {
			const state = create();
			state.fail();
			state.succeed();
			recoverApi();

			expect(retry).not.toHaveBeenCalled();
		});

		it('never retries on the server', () => {
			TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
			const state = create();
			state.fail();
			recoverApi();

			expect(retry).not.toHaveBeenCalled();
		});
	});
});
