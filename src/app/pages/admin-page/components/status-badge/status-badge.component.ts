import { Component, input } from '@angular/core';
import { NewsStatus } from 'src/app/interfaces/api-responses';

/** What an admin list row is: a published item's status, or a draft. */
export type ItemStatus = NewsStatus | 'draft';

const STATUS_LABELS: Record<ItemStatus, string> = {
	live: 'Live',
	hidden: 'Hidden',
	scheduled: 'Scheduled',
	draft: 'Draft'
};

/**
 * An item's status: Live, Scheduled, Hidden, or Draft, and
 * "Has your draft" when the editor has an unpublished edit of it.
 */
@Component({
	selector: 'app-status-badge',
	templateUrl: './status-badge.component.html',
	styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
	public readonly status = input.required<ItemStatus>();
	public readonly hasDraft = input(false);

	protected readonly labels = STATUS_LABELS;
}
