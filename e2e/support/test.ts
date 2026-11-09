// Use this `test` in every spec: it mocks the external services before each
// test, so no spec can accidentally depend on a running API or BlueMap.
import { test as base } from '@playwright/test';
import { mockExternalServices } from './mock-api';

export const test = base.extend<{ mockedServices: void }>({
	mockedServices: [
		async ({ page }, use) => {
			await mockExternalServices(page);
			await use();
		},
		{ auto: true }
	]
});

export { expect } from '@playwright/test';
