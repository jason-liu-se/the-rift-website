import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';
const isCI = !!process.env['CI'];

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL: BASE_URL, trace: 'on-first-retry' },
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } }
	],
	webServer: {
		command: 'npm start',
		url: BASE_URL,
		reuseExistingServer: !isCI,
		timeout: 120_000
	}
});
