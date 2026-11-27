import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserStorage } from './browser-storage.service';

describe('BrowserStorage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it('reads back what it saved, and nothing for unreadable JSON', () => {
		const storage = TestBed.inject(BrowserStorage);
		storage.setJson('local', 'draft:1', { title: 'Hi' });
		localStorage.setItem('draft:2', '{broken');

		expect(storage.getJson('local', 'draft:1')).toEqual({ title: 'Hi' });
		expect(storage.getJson('local', 'draft:2')).toBeUndefined();
		expect(storage.keys('local', 'draft:').sort()).toEqual([
			'draft:1',
			'draft:2'
		]);
	});

	it('goes without when storage is blocked or full', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Full', 'QuotaExceededError');
		});
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Blocked', 'SecurityError');
		});
		const storage = TestBed.inject(BrowserStorage);

		expect(() => storage.set('session', 'key', 'value')).not.toThrow();
		expect(storage.get('session', 'key')).toBeNull();
	});

	it('has no storage on the server', () => {
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
		});
		localStorage.setItem('session-user', '{}');
		const storage = TestBed.inject(BrowserStorage);

		expect(storage.get('local', 'session-user')).toBeNull();
		expect(storage.keys('local', '')).toEqual([]);
	});
});
