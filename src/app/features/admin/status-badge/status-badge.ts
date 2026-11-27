import { Component, input } from '@angular/core';
import { NewsStatus } from 'src/app/core/api/api-responses';

/**
 * What an admin list row is: a published item's status, or the editor's
 * unpublished changes, to a new item (`draft`) or a published one (`edit`).
 */
export type ItemStatus = NewsStatus | 'draft' | 'edit';

const STATUS_LABELS: Record<ItemStatus, string> = {
	live: 'Live',
	hidden: 'Hidden',
	scheduled: 'Scheduled',
	draft: 'Unpublished',
	edit: 'Edit'
};

/**
 * An item's status: Live, Scheduled, or Hidden (or Unpublished or Edit for
 * unpublished changes), and "Unpublished changes" when the editor has some.
 */
@Component({
	selector: 'app-status-badge',
	templateUrl: './status-badge.html',
	styleUrl: './status-badge.scss'
})
export class StatusBadge {
	/** None shows only whether it has unpublished changes. */
	public readonly status = input<ItemStatus>();
	public readonly hasDraft = input(false);

	protected readonly labels = STATUS_LABELS;
}
