import { formatRelativeTime } from './relative-time';

const NOW = Date.UTC(2026, 0, 31, 12);
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

describe('formatRelativeTime', () => {
	it.each([
		['under a minute', ago(30 * 1000), 'just now'],
		['minutes', ago(5 * MINUTE), '5 minutes ago'],
		['a day', ago(DAY), 'yesterday'],
		['days', ago(3 * DAY), '3 days ago'],
		['weeks', ago(15 * DAY), '2 weeks ago'],
		['the future', ago(-2 * DAY), 'in 2 days']
	])('says %s', (_, iso, text) => {
		expect(formatRelativeTime(iso, NOW)).toBe(text);
	});
});
