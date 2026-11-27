import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Draft } from 'src/app/core/api/api-responses';
import { ApiStatusMonitor } from 'src/app/core/api/api-status/api-status-monitor';
import { AuthSession } from 'src/app/core/auth/auth-session';
import {
	LocalDraft,
	LocalDrafts
} from 'src/app/features/admin/drafts/local-drafts';
import { environment } from 'src/environments/environment';
import { DraftStore } from './draft-store';

const DRAFTS_URL = `${environment.API_URL}/editor/drafts`;

function copy(overrides: Partial<LocalDraft>): LocalDraft {
	return {
		id: 'd',
		owner: 'me',
		type: 'news',
		fields: { title: 'Mine' },
		isPending: true,
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides
	} as LocalDraft;
}

function saved(id: string, revision: number): Draft {
	return {
		id,
		type: 'news',
		fields: {},
		revision,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z'
	} as Draft;
}

describe('DraftStore', () => {
	let http: HttpTestingController;
	let local: LocalDrafts;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ApiStatusMonitor,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthSession,
					useValue: { user: signal({ id: 'me' }) }
				}
			]
		});
		http = TestBed.inject(HttpTestingController);
		local = TestBed.inject(LocalDrafts);
	});

	afterEach(() => http.verify());

	it.each<{
		case: string;
		copy: Partial<LocalDraft>;
		onServer: Draft[];
		sentTo?: string;
		startingRevision?: number;
		isKept: boolean;
	}>([
		{
			case: 'drops a copy with no waiting change',
			copy: { isPending: false, revision: 2 },
			onServer: [saved('d', 2)],
			isKept: false
		},
		{
			case: 'sends a waiting change on the same revision',
			copy: { revision: 2 },
			onServer: [saved('d', 2)],
			sentTo: 'd',
			startingRevision: 2,
			isKept: false
		},
		{
			case: 'creates a draft never sent',
			copy: {},
			onServer: [],
			sentTo: 'd',
			isKept: false
		},
		{
			case: 'keeps a copy of a draft changed elsewhere, for the editor',
			copy: { revision: 2 },
			onServer: [saved('d', 3)],
			isKept: true
		},
		{
			case: 'recreates a draft deleted elsewhere, under a new ID',
			copy: { revision: 2 },
			onServer: [],
			sentTo: 'new',
			isKept: false
		}
	])(
		'$case',
		({ copy: overrides, onServer, sentTo, startingRevision, isKept }) => {
			vi.spyOn(crypto, 'randomUUID').mockReturnValue(
				'new' as ReturnType<typeof crypto.randomUUID>
			);
			local.save(copy(overrides));
			const store = TestBed.inject(DraftStore);

			store.sync();
			http.expectOne({ method: 'GET', url: DRAFTS_URL }).flush(onServer);

			if (sentTo) {
				const put = http.expectOne(`${DRAFTS_URL}/${sentTo}`);
				expect(put.request.body.startingRevision).toBe(
					startingRevision
				);
				put.flush(saved(sentTo, (startingRevision ?? 0) + 1));
			}
			expect(local.list('me').map(({ id }) => id)).toEqual(
				isKept ? ['d'] : []
			);
		}
	);

	it('sends one write at a time, each with the revision the last one got', () => {
		const store = TestBed.inject(DraftStore);
		store.keep({ id: 'd', type: 'news', fields: { title: 'A' } });
		store.send('d').subscribe();
		store.keep({ id: 'd', type: 'news', fields: { title: 'AB' } });
		store.send('d').subscribe();

		const first = http.expectOne(`${DRAFTS_URL}/d`);
		first.flush(saved('d', 1));
		const second = http.expectOne(`${DRAFTS_URL}/d`);
		expect(second.request.body).toEqual({
			type: 'news',
			fields: { title: 'AB' },
			startingRevision: 1
		});
		second.flush(saved('d', 2));
		expect(store.isPending('d')).toBe(false);
	});
});
