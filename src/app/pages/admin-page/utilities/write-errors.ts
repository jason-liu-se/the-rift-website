import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ErrorResponse } from 'src/app/interfaces/api-responses';

/** Why a write failed, for a snackbar: the API's reason when it gave one. */
export function describeWriteError(error: unknown): string {
	if (!(error instanceof HttpErrorResponse)) {
		return 'Something went wrong. Try again.';
	}
	switch (error.status) {
		case 0:
			return "The server didn't answer. Check your connection and try again.";
		case HttpStatusCode.Conflict:
			return 'It changed since you loaded it. The list has been reloaded; try again.';
		case HttpStatusCode.NotFound:
			return 'It no longer exists.';
		case HttpStatusCode.TooManyRequests:
			return 'Too many changes at once. Wait a few seconds and try again.';
		case HttpStatusCode.BadRequest:
			return `The server refused it: ${apiReason(error) ?? 'invalid request'}.`;
		default:
			return error.status >= HttpStatusCode.InternalServerError
				? 'The server failed. Try again.'
				: (apiReason(error) ?? 'Something went wrong. Try again.');
	}
}

function apiReason(error: HttpErrorResponse): string | undefined {
	return (error.error as Partial<ErrorResponse> | null)?.error;
}
