// Intl rather than Angular's DatePipe: the pipe's formatting code would join
// @angular/common's chunk, which every page loads.
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

/** An ISO 8601 date-time in the editor's time zone: "4 Mar 2026, 12:30". */
export function formatDateTime(isoDate: string): string {
	return DATE_TIME_FORMAT.format(new Date(isoDate));
}
