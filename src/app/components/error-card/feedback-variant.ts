/** The kinds of feedback an error card or banner shows. */
export type FeedbackVariant = 'error' | 'warning' | 'success';

/**
 * Errors and warnings interrupt a screen reader (`alert`); success waits for
 * a pause (`status`).
 */
export function feedbackRole(variant: FeedbackVariant): 'alert' | 'status' {
	return variant === 'success' ? 'status' : 'alert';
}
