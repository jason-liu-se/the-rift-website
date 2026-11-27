import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AUTOSAVE_DELAY_MS } from 'src/app/core/config/admin';
import { Draft, EditorNewsPost } from 'src/app/core/api/api-responses';
import { ApiStatus } from 'src/app/core/api/api-status/api-status.service';
import { ApiStatusService } from 'src/app/core/api/api-status/api-status.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import { LocalDraftsService } from 'src/app/services/drafts/local-drafts.service';
import { environment } from 'src/environments/environment';
import { DraftSession, DraftSessionStart } from './draft-session';
import { DraftStore } from './draft-store.service';

const DRAFTS_URL = `${environment.API_URL}/editor/drafts`;

function draft(id: string, revision: number, fields: object): Draft {
	return {
		id,
		type: 'news',
		fields,
		revision,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z'
	} as Draft;
}

const ITEM: EditorNewsPost = {
	id: 'post-1',
	title: 'Theirs',
	content: 'Their content',
	date: '2026-01-01T00:00:00.000Z',
	status: 'live',
	visible: true,
	revision: 5
};

describe('DraftSession', () => {
	let httpTesting: HttpTestingController;
	let apiStatus: ReturnType<typeof signal<ApiStatus>>;
	let localDrafts: LocalDraftsService;
	let ids: number;

	/** A session; with `revision`, of a draft the server has at it. */
	function start({
		revision,
		...overrides
	}: Partial<DraftSessionStart<'news'>> & { revision?: number } = {}) {
		const store = TestBed.inject(DraftStore);
		if (revision !== undefined) {
			store.noteRevision(overrides.id!, revision);
		}
		return new DraftSession(
			{
				type: 'news',
				fields: {},
				baseline: {},
				...(revision !== undefined && {
					savedFields: overrides.fields
				}),
				...overrides
			},
			{
				drafts: TestBed.inject(DraftsService),
				store,
				apiStatus,
				createId: () => `id-${++ids}`
			}
		);
	}

	/** Lets the autosave fire, then answers its PUT. */
	function flushAutosave(response: Draft) {
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		const request = httpTesting.expectOne({ method: 'PUT' });
		const body = request.request.body;
		request.flush(response);
		return { url: request.request.url, body };
	}

	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();
		ids = 0;
		apiStatus = signal<ApiStatus>('up');
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: ApiStatusService, useValue: { status: apiStatus } },
				{
					provide: AuthService,
					useValue: { user: signal({ id: 'editor-1' }) }
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		localDrafts = TestBed.inject(LocalDraftsService);
	});

	afterEach(() => {
		vi.useRealTimers();
		httpTesting.verify();
	});

	it('saves locally at once and to the server once typing pauses', () => {
		const session = start();
		session.update({ title: 'H' });
		session.update({ title: 'Hi' });

		expect(session.status()).toBe('local');
		expect(localDrafts.find('id-1')?.fields).toEqual({ title: 'Hi' });
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
		httpTesting.expectNone({ method: 'PUT' });

		const { url, body } = flushAutosave(draft('id-1', 1, { title: 'Hi' }));
		expect(url).toBe(`${DRAFTS_URL}/id-1`);
		expect(body).toEqual({ type: 'news', fields: { title: 'Hi' } });
		expect(session.status()).toBe('saved');
		// Once the server has it, this browser's copy goes.
		expect(localDrafts.find('id-1')).toBeUndefined();

		// Later saves send the revision the server last gave.
		session.update({ content: 'More' });
		expect(flushAutosave(draft('id-1', 2, {})).body.startingRevision).toBe(
			1
		);
	});

	it('keeps no empty draft, and no edit draft until something changed', () => {
		const empty = start();
		empty.update({ title: '  ' });
		const edit = start({
			fields: { title: 'Theirs' },
			baseline: { title: 'Theirs' },
			target: { id: 'post-1', startingRevision: 5 }
		});
		edit.update({ title: 'Theirs' });

		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		httpTesting.expectNone({ method: 'PUT' });
		expect(empty.status()).toBe('unchanged');
		expect(edit.hasChanges()).toBe(false);
		expect(localStorage.length).toBe(0);

		edit.update({ title: 'Mine' });
		expect(edit.hasChanges()).toBe(true);
		expect(flushAutosave(draft('id-2', 1, {})).body.target).toEqual({
			id: 'post-1',
			startingRevision: 5
		});
	});

	it("keeps an edit's visibility change, but no new draft with only that", () => {
		const fresh = start({
			fields: { visible: true },
			baseline: { visible: true }
		});
		fresh.update({ visible: false });
		const edit = start({
			fields: { title: 'Theirs', visible: true },
			baseline: { title: 'Theirs', visible: true },
			target: { id: 'post-1', startingRevision: 5 }
		});
		edit.update({ visible: false });

		expect(fresh.status()).toBe('unchanged');
		expect(fresh.hasUnpublishedChanges()).toBe(false);
		expect(edit.hasUnpublishedChanges()).toBe(true);
		expect(flushAutosave(draft('id-2', 1, {})).body.fields).toEqual({
			title: 'Theirs',
			visible: false
		});
	});

	it('keeps editing offline, and the store sends it once the server is back', () => {
		apiStatus.set('offline');
		TestBed.tick();
		const session = start();
		session.update({ title: 'Offline' });
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		httpTesting.expectNone({ method: 'PUT' });
		expect(session.status()).toBe('local');

		apiStatus.set('up');
		TestBed.tick();
		httpTesting.expectOne({ method: 'GET', url: DRAFTS_URL }).flush([]);
		httpTesting
			.expectOne({ method: 'PUT' })
			.flush(draft('id-1', 1, { title: 'Offline' }));
		expect(session.status()).toBe('saved');
		session.close();
	});

	it('undoes and redoes, grouping quick changes to one field', () => {
		const session = start();
		session.update({ title: 'H' });
		session.update({ title: 'Hi' });
		vi.advanceTimersByTime(2000);
		session.update({ content: 'Body' });

		session.undo();
		expect(session.fields()).toEqual({ title: 'Hi' });
		session.undo();
		expect(session.fields()).toEqual({});
		expect(session.canUndo()).toBe(false);
		session.redo();
		expect(session.fields()).toEqual({ title: 'Hi' });
		session.close();
		httpTesting.expectOne({ method: 'PUT' }).flush(draft('id-1', 1, {}));
	});

	it("lets the editor keep their version or another device's on a 409", () => {
		const session = start({
			id: 'd',
			revision: 1,
			fields: { title: 'A' },
			baseline: { title: 'A' }
		});
		session.update({ title: 'Mine' });
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		httpTesting.expectOne({ method: 'PUT' }).flush(
			{
				error: 'saved elsewhere',
				current: draft('d', 3, { title: 'Theirs' })
			},
			{ status: 409, statusText: 'Conflict' }
		);
		expect(session.status()).toBe('conflict');
		expect(session.conflict()?.kind).toBe('draft');

		session.resolveDraftConflict('mine').subscribe();
		const resave = httpTesting.expectOne({ method: 'PUT' });
		expect(resave.request.body).toEqual({
			type: 'news',
			fields: { title: 'Mine' },
			startingRevision: 3
		});
		resave.flush(draft('d', 4, { title: 'Mine' }));
		expect(session.status()).toBe('saved');
	});

	it('takes the other version when the editor keeps theirs', () => {
		const session = start({
			id: 'd',
			revision: 1,
			fields: { title: 'A' },
			baseline: { title: 'A' }
		});
		session.update({ title: 'Mine' });
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		httpTesting
			.expectOne({ method: 'PUT' })
			.flush(
				{ error: 'x', current: draft('d', 3, { title: 'Theirs' }) },
				{ status: 409, statusText: 'Conflict' }
			);

		session.resolveDraftConflict('theirs').subscribe();

		expect(session.fields()).toEqual({ title: 'Theirs' });
		expect(session.status()).toBe('saved');
		session.close();
	});

	it('publishes after saving pending changes', () => {
		const session = start();
		session.update({ title: 'New', content: 'Body' });
		let published: unknown;
		session
			.publish({ visible: true, date: 'now' })
			.subscribe((item) => (published = item));

		httpTesting.expectOne({ method: 'PUT' }).flush(draft('id-1', 1, {}));
		const publish = httpTesting.expectOne(`${DRAFTS_URL}/id-1/publish`);
		expect(publish.request.body).toEqual({ visible: true, date: 'now' });
		publish.flush(ITEM);

		expect(published).toEqual(ITEM);
		expect(session.status()).toBe('published');
		expect(localDrafts.find('id-1')).toBeUndefined();
	});

	it('moves to the changed item to overwrite it, or merges by hand', () => {
		const session = start({
			id: 'd',
			revision: 1,
			fields: { title: 'Mine' },
			baseline: { title: 'Old' },
			target: { id: 'post-1', startingRevision: 4 }
		});
		session
			.publish({ visible: true })
			.subscribe({ error: () => undefined });
		httpTesting
			.expectOne(`${DRAFTS_URL}/d/publish`)
			.flush(
				{ error: 'changed', current: ITEM },
				{ status: 409, statusText: 'Conflict' }
			);
		expect(session.conflict()?.kind).toBe('item');

		session.resolveItemConflict('merge').subscribe();
		// The old draft goes; a new one starts from the item as it is now.
		httpTesting
			.expectOne({ method: 'DELETE', url: `${DRAFTS_URL}/d` })
			.flush(null);
		const created = httpTesting.expectOne(`${DRAFTS_URL}/id-1`);
		expect(created.request.body.target).toEqual({
			id: 'post-1',
			startingRevision: 5
		});
		expect(created.request.body.fields).toEqual({ title: 'Mine' });
		created.flush(draft('id-1', 1, {}));
		expect(session.mergeReference()).toEqual({
			title: 'Theirs',
			content: 'Their content',
			visible: true
		});
		session.close();
	});

	it('publishes as new when the item was deleted', () => {
		const session = start({
			id: 'd',
			revision: 1,
			fields: { title: 'Mine' },
			baseline: {},
			target: { id: 'post-1', startingRevision: 4 }
		});
		session
			.publish({ visible: true })
			.subscribe({ error: () => undefined });
		httpTesting
			.expectOne(`${DRAFTS_URL}/d/publish`)
			.flush({ error: 'gone' }, { status: 404, statusText: 'Not Found' });
		expect(session.conflict()).toEqual({ kind: 'deleted' });

		session.publishAsNew({ visible: true }).subscribe();
		const publish = httpTesting.expectOne(`${DRAFTS_URL}/d/publish`);
		expect(publish.request.body).toEqual({ visible: true, asNew: true });
		publish.flush(ITEM);
	});

	it('creates the draft before publishing an edit with nothing changed', () => {
		const session = start({
			fields: { title: 'Theirs' },
			baseline: { title: 'Theirs' },
			target: { id: 'post-1', startingRevision: 5 }
		});
		session.publish({ visible: true }).subscribe();

		const created = httpTesting.expectOne(`${DRAFTS_URL}/id-1`);
		expect(created.request.body.target).toEqual({
			id: 'post-1',
			startingRevision: 5
		});
		created.flush(draft('id-1', 1, { title: 'Theirs' }));
		httpTesting.expectOne(`${DRAFTS_URL}/id-1/publish`).flush(ITEM);
		expect(session.status()).toBe('published');
	});

	it('sends a waiting change when closed, instead of dropping it', () => {
		const session = start();
		session.update({ title: 'Quick' });
		session.close();

		httpTesting
			.expectOne(`${DRAFTS_URL}/id-1`)
			.flush(draft('id-1', 1, { title: 'Quick' }));
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		httpTesting.expectNone({ method: 'PUT' });
	});
});
