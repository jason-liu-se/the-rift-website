const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000]
];

const FORMAT = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** How long ago (or until) `iso` is from `now`: "3 days ago", "just now". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
	const difference = new Date(iso).getTime() - now;
	const unit = UNITS.find(([, size]) => Math.abs(difference) >= size);
	return unit
		? FORMAT.format(Math.round(difference / unit[1]), unit[0])
		: 'just now';
}
