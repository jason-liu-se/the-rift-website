/** The kinds of feedback a feedback card shows. */
export type FeedbackVariant = 'error' | 'warning' | 'success';

/**
 * Errors and warnings interrupt a screen reader (`alert`); success waits for
 * a pause (`status`).
 */
export function feedbackRole(variant: FeedbackVariant): 'alert' | 'status' {
	return variant === 'success' ? 'status' : 'alert';
}
