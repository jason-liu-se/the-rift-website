import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { EDITOR_NEWS_POSTS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { EditorListActions } from './editor-list.actions';
import { EditorListStore } from './editor-list.store';

const EDITOR_URL = `${environment.API_URL}/editor`;
const DRAFT = {
	id: 'draft-1',
	type: 'news',
	fields: { title: 'Unfinished' },
	revision: 1,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('EditorListStore and EditorListActions', () => {
	let http: HttpTestingController;
	let store: EditorListStore;
	let actions: EditorListActions;
	let confirmations: string[];
	let messages: string[];

	beforeEach(() => {
		localStorage.clear();
		confirmations = [];
		messages = [];
		TestBed.configureTestingModule({
			providers: [
				EditorListStore,
				EditorListActions,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ActivatedRoute,
					useValue: {
						paramMap: of(convertToParamMap({ type: 'news' })),
						queryParamMap: of(convertToParamMap({}))
					}
				},
				{ provide: Router, useValue: { navigate: vi.fn() } },
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: 'me' }) }
				},
				{
					provide: MatDialog,
					useValue: {
						open: (
							_: unknown,
							{ data }: { data: { title: string } }
						) => {
							confirmations.push(data.title);
							return { afterClosed: () => of(true) };
						}
					}
				},
				{
					provide: AdminNotifierService,
					useValue: {
						notify: ({ message }: { message: string }) =>
							messages.push(message),
						notifySuccess: (message: string) =>
							messages.push(message),
						notifyFailure: (message: string) =>
							messages.push(message),
						notifyWithUndo: (message: string) =>
							messages.push(message)
					}
				}
			]
		});
		http = TestBed.inject(HttpTestingController);
		store = TestBed.inject(EditorListStore);
		actions = TestBed.inject(EditorListActions);
		TestBed.tick();
	});

	/** Answers the list's requests: a page of posts and one draft. */
	function answerLoad(): void {
		http.match(({ url }) => url === `${EDITOR_URL}/news`).forEach(
			(request) => request.flush({ items: EDITOR_NEWS_POSTS, total: 30 })
		);
		http.match(({ url }) => url === `${EDITOR_URL}/drafts`).forEach(
			(request) => request.flush([DRAFT])
		);
	}

	it('loads the posts and drafts, and clears the selection on every reload', () => {
		answerLoad();
		expect(store.itemRows()).toHaveLength(EDITOR_NEWS_POSTS.length);
		expect(store.draftRows().map(({ id }) => id)).toEqual(['draft-1']);

		store.selection.toggleDraft('draft-1');
		store.reload();
		TestBed.tick();

		expect(store.selectedCount()).toBe(0);
		answerLoad();
	});

	it('deletes a mixed selection after one confirmation: the posts in bulk, the drafts one by one', () => {
		answerLoad();
		store.selection.selectPage(store.pageRows());

		actions.runBulkAction({ action: 'delete' });

		expect(confirmations).toEqual([
			`Delete ${EDITOR_NEWS_POSTS.length} posts and 1 unpublished change?`
		]);
		const bulk = http.expectOne(`${EDITOR_URL}/news/bulk`);
		expect(bulk.request.method).toBe('DELETE');
		expect(bulk.request.body.items).toHaveLength(EDITOR_NEWS_POSTS.length);
		bulk.flush({
			results: EDITOR_NEWS_POSTS.map(({ id }) => ({ id, outcome: 'ok' }))
		});
		http.expectOne(`${EDITOR_URL}/drafts/draft-1`).flush(null);

		expect(messages).toHaveLength(2);
		answerLoad();
	});

	it('hides only the posts of a selection with drafts, without asking', () => {
		answerLoad();
		store.selection.selectPage(store.pageRows());

		actions.runBulkAction({ action: 'hide' });

		expect(confirmations).toEqual([]);
		const bulk = http.expectOne(`${EDITOR_URL}/news/bulk`);
		expect(bulk.request.body).toMatchObject({ action: 'hide' });
		expect(bulk.request.body.items).toHaveLength(EDITOR_NEWS_POSTS.length);
		bulk.flush({ results: [] });
		http.expectNone(`${EDITOR_URL}/drafts/draft-1`);
		answerLoad();
	});
});
