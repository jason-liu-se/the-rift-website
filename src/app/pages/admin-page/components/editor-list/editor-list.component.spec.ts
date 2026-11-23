import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
	ActivatedRoute,
	Router,
	convertToParamMap,
	provideRouter
} from '@angular/router';
import {
	DraftSummary,
	EditorNewsPostSummary
} from 'src/app/interfaces/api-responses';
import { EDITOR_SEARCH_DEBOUNCE_MS } from 'src/app/config/admin';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { EditorListComponent } from './editor-list.component';

const NEWS_URL = `${environment.API_URL}/editor/news`;
const DRAFTS_URL = `${environment.API_URL}/editor/drafts?type=news`;

function post(index: number, overrides: Partial<EditorNewsPostSummary> = {}) {
	return {
		id: `post-${index}`,
		title: `Post **${index}**`,
		date: '2026-01-01T12:00:00.000Z',
		status: 'live',
		visible: true,
		revision: index,
		createdBy: { id: '1', username: 'editor' },
		...overrides
	} as EditorNewsPostSummary;
}

const DRAFTS: DraftSummary[] = [
	{
		id: 'draft-new',
		type: 'news',
		fields: { title: 'Unfinished' },
		revision: 1,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z'
	},
	{
		id: 'draft-edit',
		type: 'news',
		fields: { title: 'Edit' },
		target: { id: 'post-1', startingRevision: 1 },
		revision: 1,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z'
	}
];

describe('EditorListComponent', () => {
	let fixture: ComponentFixture<EditorListComponent<'news'>>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let notify: ReturnType<typeof vi.fn>;
	let isConfirmed: boolean;
	let urlParams: Record<string, string>;
	let navigate: ReturnType<typeof vi.spyOn>;

	const rows = () => [...element.querySelectorAll('tbody tr')];
	const rowText = (row: Element) => row.textContent?.replace(/\s+/g, ' ');
	const checkbox = (label: string) =>
		element.querySelector<HTMLInputElement>(
			`input[type="checkbox"][aria-label="${label}"]`
		)!;
	const button = (name: string) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => candidate.textContent?.trim() === name
		)!;
	const statusText = () =>
		element.querySelector('[role="status"]')?.textContent?.trim();
	/** Presses a key on the first row's checkbox. */
	const press = (key: string, init: KeyboardEventInit = {}) => {
		element
			.querySelector('tbody input[type="checkbox"]')!
			.dispatchEvent(
				new KeyboardEvent('keydown', { key, bubbles: true, ...init })
			);
		fixture.detectChanges();
	};

	function flushList(
		url = `${NEWS_URL}?startIndex=0&limit=25`,
		items = [post(1, { createdBy: undefined }), post(2)],
		total = items.length
	) {
		httpTesting.expectOne(url).flush({ items, total });
		httpTesting.expectOne(DRAFTS_URL).flush(DRAFTS);
		fixture.detectChanges();
	}

	beforeEach(() => {
		notify = vi.fn();
		isConfirmed = true;
		urlParams ??= {};
		TestBed.configureTestingModule({
			imports: [EditorListComponent],
			providers: [
				provideRouter([]),
				{
					provide: ActivatedRoute,
					useFactory: () => ({
						snapshot: {
							queryParamMap: convertToParamMap(urlParams)
						}
					})
				},
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AdminNotifierService,
					useValue: {
						notify,
						notifySuccess: notify,
						notifyFailure: notify
					}
				},
				{
					provide: MatDialog,
					useValue: {
						open: () => ({ afterClosed: () => of(isConfirmed) })
					}
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		navigate = vi
			.spyOn(TestBed.inject(Router), 'navigate')
			.mockResolvedValue(true);
		fixture = TestBed.createComponent(EditorListComponent<'news'>);
		fixture.componentRef.setInput('type', 'news');
		fixture.componentRef.setInput('noun', { one: 'post', many: 'posts' });
		fixture.componentRef.setInput('searchFields', [
			{ value: 'title', label: 'Title' }
		]);
		element = fixture.nativeElement;
		fixture.detectChanges();
	});

	afterEach(() => {
		httpTesting.verify();
		urlParams = undefined!;
	});

	it('lists every item with its status and editors, after the new drafts', () => {
		flushList();

		const cells = (row: Element) =>
			[...row.querySelectorAll('td')].map((cell) =>
				cell.textContent?.replace(/\s+/g, ' ').trim()
			);
		expect(cells(rows()[0]).slice(1, 5)).toEqual([
			'Unfinished',
			'Draft',
			'editor',
			'editor'
		]);
		// Markdown is stripped from names; old items have no author.
		expect(cells(rows()[1]).slice(1, 5)).toEqual([
			'Post 1',
			'Live Has your draft',
			'unknown',
			'unknown'
		]);
		expect(cells(rows()[2]).slice(1, 5)).toEqual([
			'Post 2',
			'Live',
			'editor',
			'unknown'
		]);
	});

	it('searches once typing stops, in the chosen fields', async () => {
		flushList();
		const search: HTMLInputElement = element.querySelector(
			'input[type="search"]'
		)!;
		search.value = 'season';
		search.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		// Nothing is sent while the editor may still be typing.
		httpTesting.expectNone(() => true);

		await new Promise((resolve) =>
			setTimeout(resolve, EDITOR_SEARCH_DEBOUNCE_MS)
		);
		fixture.detectChanges();

		flushList(`${NEWS_URL}?q=season&startIndex=0&limit=25`);
	});

	it('says how many are selected as rows are checked', () => {
		flushList();

		checkbox('Select Post 1').click();
		fixture.detectChanges();

		expect(statusText()).toBe('1 of 3 selected');
	});

	it('previews selecting the page on Ctrl+A, and selects it on Enter', () => {
		flushList();

		press('a', { ctrlKey: true });
		expect(element.querySelector('.preview-hint')).not.toBeNull();
		expect(statusText()).toBe('');

		press('Enter');
		expect(statusText()).toBe('3 of 3 selected');
		expect(element.querySelector('.preview-hint')).toBeNull();
	});

	it('cancels a Ctrl+A preview, and clears a selection, on Escape', () => {
		flushList();

		press('a', { ctrlKey: true });
		press('Escape');
		expect(statusText()).toBe('');

		checkbox('Select Post 2').click();
		fixture.detectChanges();
		press('Escape');
		expect(statusText()).toBe('');
	});

	it('runs a bulk action on the selection, sums it up, and reloads', () => {
		flushList();
		checkbox('Select Post 2').click();
		fixture.detectChanges();

		button('Hide').click();
		const bulk = httpTesting.expectOne(`${NEWS_URL}/bulk`);
		expect(bulk.request.body).toEqual({
			action: 'hide',
			items: [{ id: 'post-2', startingRevision: 2 }]
		});
		bulk.flush({ results: [{ id: 'post-2', outcome: 'ok' }] });

		expect(notify).toHaveBeenCalledWith({
			message: 'Hid 1 post.',
			hasFailures: false
		});
		flushList();
		expect(statusText()).toBe('');
	});

	it('selects every match across pages, and acts on all of them', () => {
		const firstPage = Array.from({ length: 25 }, (_, i) => post(i + 1));
		flushList(undefined, firstPage, 30);

		checkbox('Select every row on this page').click();
		fixture.detectChanges();
		button('Select all 30 posts matching').click();
		fixture.detectChanges();
		// The listed draft is on the page, so it's selected too.
		expect(statusText()).toBe('31 of 31 selected');

		button('Show').click();
		httpTesting
			.expectOne(`${NEWS_URL}?startIndex=0&limit=25`)
			.flush({ items: firstPage, total: 30 });
		httpTesting.expectOne(`${NEWS_URL}?startIndex=25&limit=25`).flush({
			items: Array.from({ length: 5 }, (_, i) => post(i + 26)),
			total: 30
		});
		const bulk = httpTesting.expectOne(`${NEWS_URL}/bulk`);
		expect(bulk.request.body.items).toHaveLength(30);
		bulk.flush({ results: [] });
		flushList();
	});

	it('deletes only once the deletion is confirmed', () => {
		flushList();
		checkbox('Select Post 1').click();
		fixture.detectChanges();

		isConfirmed = false;
		button('Delete').click();
		httpTesting.expectNone(`${NEWS_URL}/bulk`);

		isConfirmed = true;
		button('Delete').click();
		httpTesting
			.expectOne({ method: 'DELETE', url: `${NEWS_URL}/bulk` })
			.flush({ results: [{ id: 'post-1', outcome: 'ok' }] });
		flushList();
	});

	it('lists drafts saved only in this browser (made offline)', () => {
		flushList();
		localStorage.setItem(
			'draft:offline',
			JSON.stringify({
				id: 'offline',
				type: 'news',
				owner: '1',
				fields: { title: 'Written offline' },
				isPending: true,
				updatedAt: '2026-01-01T00:00:00.000Z'
			})
		);
		fixture.componentInstance.reloadItems();
		flushList();

		expect(rows()[0].textContent).toContain('Written offline');
		localStorage.clear();
	});

	it('shows only the drafts for the "My drafts" filter', () => {
		flushList();

		fixture.componentInstance['setFilters']({
			scope: 'all',
			status: 'draft',
			collection: '',
			search: '',
			searchFields: []
		});
		fixture.detectChanges();
		httpTesting.expectOne(DRAFTS_URL).flush(DRAFTS);
		fixture.detectChanges();

		expect(rows().map(rowText)).toEqual([
			expect.stringContaining('Unfinished')
		]);
	});

	it('opens an item or draft from a click anywhere on its row', () => {
		flushList();
		const edited = vi.fn();
		const opened = vi.fn();
		fixture.componentInstance.editItem.subscribe(edited);
		fixture.componentInstance.openDraft.subscribe(opened);

		rows()[1]
			.querySelector<HTMLElement>('td[data-label="Status"]')!
			.click();
		rows()[0].querySelector<HTMLElement>('td.item')!.click();

		expect(edited).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'post-1' })
		);
		expect(opened).toHaveBeenCalledWith(DRAFTS[0]);
	});

	it("doesn't open a row from its own controls", () => {
		flushList();
		const edited = vi.fn();
		fixture.componentInstance.editItem.subscribe(edited);

		checkbox('Select Post 1').click();
		rows()[1]
			.querySelector<HTMLButtonElement>(
				'button[aria-label^="More actions"]'
			)!
			.click();

		expect(edited).not.toHaveBeenCalled();
		// Close the menu the click opened.
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	});

	it('emits edit and draft actions for the tool to open', () => {
		flushList();
		const edited = vi.fn();
		const opened = vi.fn();
		fixture.componentInstance.editItem.subscribe(edited);
		fixture.componentInstance.openDraft.subscribe(opened);

		rows()[1].querySelector<HTMLButtonElement>('.actions button')!.click();
		rows()[0].querySelector<HTMLButtonElement>('.actions button')!.click();

		expect(edited).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'post-1' })
		);
		expect(opened).toHaveBeenCalledWith(DRAFTS[0]);
	});

	it('selects drafts with their own checkbox and deletes them with the items', () => {
		flushList();
		checkbox('Select draft Unfinished').click();
		checkbox('Select Post 1').click();
		fixture.detectChanges();
		expect(statusText()).toBe('2 of 3 selected');

		button('Delete').click();
		httpTesting
			.expectOne({ method: 'DELETE', url: `${NEWS_URL}/bulk` })
			.flush({ results: [{ id: 'post-1', outcome: 'ok' }] });
		httpTesting
			.expectOne({
				method: 'DELETE',
				url: `${environment.API_URL}/editor/drafts/draft-new`
			})
			.flush(null);

		expect(notify).toHaveBeenCalledWith({
			message: 'Deleted 1 draft.',
			hasFailures: false
		});
		flushList();
	});

	it('includes drafts in the page that Ctrl+A selects', () => {
		flushList();

		press('a', { ctrlKey: true });
		expect(element.querySelector('.preview-hint')?.textContent).toContain(
			'Select all 2 posts and 1 draft on this page?'
		);
		press('Enter');

		expect(statusText()).toBe('3 of 3 selected');
	});

	it('skips drafts for actions other than delete, saying so', () => {
		flushList();
		checkbox('Select draft Unfinished').click();
		fixture.detectChanges();

		button('Hide').click();

		httpTesting.expectNone(`${NEWS_URL}/bulk`);
		expect(notify).toHaveBeenCalledWith({
			message:
				'Skipped 1 draft: drafts can only be deleted. Publish them first.',
			hasFailures: true
		});
		flushList();
	});

	it("shows a draft's image beside its name", () => {
		const withImage = [
			{
				...DRAFTS[0],
				fields: { title: 'Pic', imageUrl: 'https://i.ibb.co/a/x.png' }
			}
		];
		httpTesting
			.expectOne(`${NEWS_URL}?startIndex=0&limit=25`)
			.flush({ items: [], total: 0 });
		httpTesting.expectOne(DRAFTS_URL).flush(withImage);
		fixture.detectChanges();

		expect(rows()[0].querySelector('img')?.getAttribute('src')).toBe(
			'https://i.ibb.co/a/x.png'
		);
	});

	it('saves the filters and page in the URL as they change', () => {
		flushList();

		fixture.componentInstance['setFilters']({
			scope: 'mine',
			status: 'hidden',
			collection: '',
			search: '',
			searchFields: []
		});
		fixture.detectChanges();
		TestBed.tick();

		expect(navigate).toHaveBeenLastCalledWith(
			[],
			expect.objectContaining({
				queryParams: expect.objectContaining({
					status: 'hidden',
					by: 'mine'
				}),
				queryParamsHandling: 'merge',
				replaceUrl: true
			})
		);
		flushList(
			`${NEWS_URL}?status=hidden&createdBy=1&startIndex=0&limit=25`
		);
	});
});

describe('EditorListComponent from a URL with filters', () => {
	it('starts with the filters and page the URL saved', async () => {
		TestBed.configureTestingModule({
			imports: [EditorListComponent],
			providers: [
				provideRouter([]),
				{
					provide: ActivatedRoute,
					useValue: {
						snapshot: {
							queryParamMap: convertToParamMap({
								search: 'spawn',
								in: 'title',
								status: 'live',
								page: '2'
							})
						}
					}
				},
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				}
			]
		});
		const fixture = TestBed.createComponent(EditorListComponent<'news'>);
		fixture.componentRef.setInput('type', 'news');
		fixture.componentRef.setInput('noun', { one: 'post', many: 'posts' });
		fixture.componentRef.setInput('searchFields', [
			{ value: 'title', label: 'Title' }
		]);
		fixture.detectChanges();
		await fixture.whenStable();

		// One request, already filtered: no unfiltered one first.
		TestBed.inject(HttpTestingController).expectOne(
			`${NEWS_URL}?status=live&q=spawn&in=title&startIndex=25&limit=25`
		);
		expect(
			(
				fixture.nativeElement as HTMLElement
			).querySelector<HTMLInputElement>('input[type="search"]')!.value
		).toBe('spawn');
	});
});
