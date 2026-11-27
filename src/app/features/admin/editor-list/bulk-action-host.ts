import { InjectionToken, Signal } from '@angular/core';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { BulkActionOf } from 'src/app/features/admin/editor-content/editor-content-types';

/** What a type's own bulk actions run on: the list's selection. */
export interface BulkActionHost {
	readonly type: Signal<EditorContentType>;
	runBulkAction(action: BulkActionOf<EditorContentType>): void;
}

export const BULK_ACTION_HOST = new InjectionToken<BulkActionHost>(
	'BulkActionHost'
);
