import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { EMPTY, Observable, filter, fromEvent, map } from 'rxjs';

/** Every key the app keeps in the browser's storage. */
export const STORAGE_KEYS = {
	/** localStorage: the last-known user (JSON). */
	savedUser: 'session-user',
	/**
	 * localStorage: set while the API hasn't confirmed a logout. Only the API
	 * can clear the httpOnly session cookies, so until it does, the old user
	 * would be logged straight back in.
	 */
	logoutPending: 'logout-pending',
	/** localStorage: each draft (JSON), under this prefix and its ID. */
	draftPrefix: 'draft:',
	/** localStorage: the collection last published to, by content type. */
	lastCollectionPrefix: 'last-collection:',
	/**
	 * sessionStorage: the page to return to after logging in again. It lasts
	 * through the Discord round trip in the same tab.
	 */
	loginReturnUrl: 'login-return-url',
	/** sessionStorage: set while reloading after a page chunk failed to load. */
	chunkReload: 'reloaded-after-chunk-error'
} as const;

export type StorageArea = 'local' | 'session';

/**
 * Every read and write of `localStorage` and `sessionStorage`. Storage can be
 * blocked or full: then reads find nothing and writes are dropped, and each
 * caller works without it. On the server, there's no storage at all.
 */
@Injectable({ providedIn: 'root' })
export class BrowserStorage {
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	public get(area: StorageArea, key: string): string | null {
		try {
			return this.storage(area)?.getItem(key) ?? null;
		} catch {
			return null;
		}
	}

	public set(area: StorageArea, key: string, value: string): void {
		try {
			this.storage(area)?.setItem(key, value);
		} catch {
			// Blocked or full: the caller goes without.
		}
	}

	public remove(area: StorageArea, key: string): void {
		try {
			this.storage(area)?.removeItem(key);
		} catch {
			// Blocked: there's nothing to remove.
		}
	}

	/** A value saved as JSON, or undefined if it's missing or unreadable. */
	public getJson<T>(area: StorageArea, key: string): T | undefined {
		try {
			const saved = this.get(area, key);
			return saved === null ? undefined : (JSON.parse(saved) as T);
		} catch {
			return undefined;
		}
	}

	public setJson(area: StorageArea, key: string, value: unknown): void {
		this.set(area, key, JSON.stringify(value));
	}

	/** The keys that start with `prefix`. */
	public keys(area: StorageArea, prefix: string): string[] {
		try {
			const storage = this.storage(area);
			return storage
				? Object.keys(storage).filter((key) => key.startsWith(prefix))
				: [];
		} catch {
			return [];
		}
	}

	/** localStorage changes made in other tabs, to `key` (or cleared). */
	public changesFromOtherTabs(key: string): Observable<void> {
		return this.isBrowser
			? fromEvent<StorageEvent>(window, 'storage').pipe(
					filter((event) => event.key === key || event.key === null),
					map(() => undefined)
				)
			: EMPTY;
	}

	private storage(area: StorageArea): Storage | undefined {
		if (!this.isBrowser) {
			return undefined;
		}
		return area === 'local' ? localStorage : sessionStorage;
	}
}
