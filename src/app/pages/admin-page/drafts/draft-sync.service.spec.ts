import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LocalDraftsService } from 'src/app/services/drafts/local-drafts.service';
import { environment } from 'src/environments/environment';
import { DraftSyncService } from './draft-sync.service';

describe('DraftSyncService', () => {
	it("sends the editor's pending local drafts, one at a time, except the open one", () => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AuthService,
					useValue: { user: signal({ id: 'me', username: 'me' }) }
				}
			]
		});
		const local = TestBed.inject(LocalDraftsService);
		const base = { type: 'news' as const, updatedAt: '', isPending: true };
		local.save({ ...base, id: 'a', owner: 'me', fields: { title: 'A' } });
		local.save({
			...base,
			id: 'b',
			owner: 'me',
			fields: { title: 'B' },
			revision: 2
		});
		local.save({ ...base, id: 'open', owner: 'me', fields: {} });
		local.save({ ...base, id: 'other', owner: 'someone', fields: {} });
		local.save({
			...base,
			id: 'synced',
			owner: 'me',
			fields: {},
			isPending: false
		});

		TestBed.inject(DraftSyncService).syncPending('open');

		const http = TestBed.inject(HttpTestingController);
		const urls: string[] = [];
		for (let i = 0; i < 2; i++) {
			const request = http.expectOne({ method: 'PUT' });
			urls.push(request.request.url);
			request.flush({ revision: 9 });
		}
		http.verify();
		expect(urls.sort()).toEqual([
			`${environment.API_URL}/editor/drafts/a`,
			`${environment.API_URL}/editor/drafts/b`
		]);
		expect(local.find('a')).toEqual(
			expect.objectContaining({ revision: 9, isPending: false })
		);
	});
});
