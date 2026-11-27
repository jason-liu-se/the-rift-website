import { signal } from '@angular/core';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { BulkActionOf } from 'src/app/features/admin/editor-content/editor-content-types';
import { BULK_ACTION_HOST, BulkActionHost } from './bulk-action-host';

/** A host that records the bulk actions run on it. */
export function provideFakeBulkActionHost(type: EditorContentType) {
	const actions: BulkActionOf<EditorContentType>[] = [];
	const host: BulkActionHost = {
		type: signal(type),
		runBulkAction: (action) => actions.push(action)
	};
	return { actions, provider: { provide: BULK_ACTION_HOST, useValue: host } };
}
