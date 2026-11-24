import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * One tool's list state shared with its modals, provided by the list page:
 * for now, asking the list to fetch again (after a publish or bulk create).
 */
@Injectable()
export class EditorListStore {
	private readonly reloadRequests = new Subject<void>();

	public readonly reloads = this.reloadRequests.asObservable();

	public reload(): void {
		this.reloadRequests.next();
	}
}
