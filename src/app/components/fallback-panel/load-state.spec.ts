import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LoadState } from './load-state';

describe('LoadState', () => {
	const create = () => TestBed.runInInjectionContext(() => new LoadState());

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
});
