// Use this `test` in every spec: it mocks the external services before each
// test, so no spec can accidentally depend on a running API or BlueMap.
import { test as base } from '@playwright/test';
import { mockExternalServices } from './mock-api';

export const test = base.extend<{ mockedServices: void }>({
	mockedServices: [
		async ({ page, baseURL }, use) => {
			if (!baseURL) {
				throw new Error('Set `use.baseURL` in playwright.config.ts');
			}
			await mockExternalServices(page, baseURL);
			await use();
		},
		{ auto: true }
	]
});

export { expect } from '@playwright/test';
