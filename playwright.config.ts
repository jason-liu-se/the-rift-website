import { defineConfig, devices } from '@playwright/test';
import { PROJECT, TAG } from './e2e/support/projects';

// E2E_PORT lets parallel worktrees run the suite side by side (with their own
// DEV_PUBLIC_API_URL port for the mock API, see .claude/rules/testing.md).
const PORT = process.env['E2E_PORT'] ?? '4200';
const BASE_URL = `http://localhost:${PORT}`;
const isCI = !!process.env['CI'];

export default defineConfig({
	testDir: 'e2e',
	// Serves the mock API to the dev server's server-side rendering.
	globalSetup: './e2e/support/mock-api-server.ts',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL: BASE_URL, trace: 'on-first-retry' },
	projects: [
		{
			name: PROJECT.desktop,
			use: { ...devices['Desktop Chrome'] },
			grepInvert: new RegExp(TAG.mobileOnly)
		},
		{
			name: PROJECT.mobile,
			use: { ...devices['Pixel 7'] },
			grepInvert: new RegExp(TAG.desktopOnly)
		}
	],
	webServer: {
		command: `npm start -- --port ${PORT}`,
		url: BASE_URL,
		reuseExistingServer: !isCI,
		timeout: 120_000
	}
});
