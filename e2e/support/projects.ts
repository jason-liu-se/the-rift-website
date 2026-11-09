// Playwright project names, and tags that limit a test to one of them
// (playwright.config.ts filters each project with `grepInvert`).
export const PROJECT = { desktop: 'desktop', mobile: 'mobile' } as const;

export const TAG = {
	desktopOnly: '@desktop-only',
	mobileOnly: '@mobile-only'
} as const;
