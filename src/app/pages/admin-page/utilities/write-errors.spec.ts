import { HttpErrorResponse } from '@angular/common/http';
import { describeWriteError } from './write-errors';

const httpError = (status: number, error: unknown = null) =>
	new HttpErrorResponse({ status, error });

describe('describeWriteError', () => {
	it.each([
		[0, "The server didn't answer. Check your connection and try again."],
		[
			409,
			'It changed since you loaded it. The list has been reloaded; try again.'
		],
		[404, 'It no longer exists.'],
		[429, 'Too many changes at once. Wait a few seconds and try again.'],
		[503, 'The server failed. Try again.']
	])('describes a %s', (status, message) => {
		expect(describeWriteError(httpError(status))).toBe(message);
	});

	it("gives the API's reason for a 400", () => {
		expect(
			describeWriteError(httpError(400, { error: 'title: too long' }))
		).toBe('The server refused it: title: too long.');
	});

	it('copes with something that is not an HTTP error', () => {
		expect(describeWriteError(new Error('x'))).toBe(
			'Something went wrong. Try again.'
		);
	});
});
