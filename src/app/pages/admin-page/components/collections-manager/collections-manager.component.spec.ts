import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { CollectionsStore } from '../../services/collections-store.service';
import {
	CollectionsManagerComponent,
	findSlugProblem,
	toSlug
} from './collections-manager.component';

const COLLECTIONS_URL = `${environment.API_URL}/editor/gallery/collections`;

describe('findSlugProblem', () => {
	it.each(['season5', 'season-5', 'a1-b2-c3'])('accepts %s', (slug) => {
		expect(findSlugProblem(slug)).toBeUndefined();
	});

	it.each(['Season5', 'season_5', 'season--5', '-season', 'season 5'])(
		'refuses %s',
		(slug) => {
			expect(findSlugProblem(slug)).toContain(
				'lowercase letters and numbers'
			);
		}
	);
});

describe('toSlug', () => {
	it.each([
		['Season 7', 'season-7'],
		['  Spawn & Shops! ', 'spawn-shops'],
		['Café', 'cafe']
	])('makes %s into %s', (title, slug) => {
		expect(toSlug(title)).toBe(slug);
	});
});

describe('CollectionsManagerComponent', () => {
	let fixture: ComponentFixture<CollectionsManagerComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let dialogMessages: string[];
	let notifyFailure: ReturnType<typeof vi.fn>;
	let changed: ReturnType<typeof vi.fn<() => void>>;

	const button = (name: string) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) =>
				(candidate.getAttribute('aria-label') ??
					candidate.textContent
						?.replace(
							candidate.querySelector('mat-icon')?.textContent ?? '',
							''
						)
						.replace(/\s+/g, ' ')
						.trim()) === name
		)!;
	const type = (name: string, value: string) => {
		const input = element.querySelector<HTMLInputElement>(
			`input[name="${name}"]`
		)!;
		input.value = value;
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
	};

	beforeEach(() => {
		dialogMessages = [];
		notifyFailure = vi.fn();
		changed = vi.fn<() => void>();
		TestBed.configureTestingModule({
			imports: [CollectionsManagerComponent],
			providers: [
				CollectionsStore,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AdminNotifierService,
					useValue: { notifySuccess: vi.fn(), notifyFailure }
				},
				{
					provide: MatDialog,
					useValue: {
						open: (
							_: unknown,
							{ data }: { data: { message: string } }
						) => {
							dialogMessages.push(data.message);
							return { afterClosed: () => of(true) };
						}
					}
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(CollectionsManagerComponent);
		fixture.componentRef.setInput('type', 'gallery');
		fixture.componentRef.setInput('itemNoun', {
			one: 'image',
			many: 'images'
		});
		fixture.componentInstance.changed.subscribe(() => changed());
		element = fixture.nativeElement;
		fixture.detectChanges();
		httpTesting
			.expectOne(COLLECTIONS_URL)
			.flush(EDITOR_GALLERY_COLLECTIONS);
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it('lists each collection with its URL and item count', () => {
		expect(
			element.querySelector('li')?.textContent?.replace(/\s+/g, ' ')
		).toContain('/gallery/season5 · 3 images');
	});

	it('fills the slug in from the title, and creates the collection', () => {
		type('title', 'Season 7');
		button('Create collection').click();
		const create = httpTesting.expectOne({
			method: 'POST',
			url: COLLECTIONS_URL
		});
		expect(create.request.body).toEqual({
			slug: 'season-7',
			title: 'Season 7',
			visible: true
		});
		create.flush({});
		httpTesting
			.expectOne(COLLECTIONS_URL)
			.flush(EDITOR_GALLERY_COLLECTIONS);

		expect(changed).toHaveBeenCalled();
	});

	it('checks an edited slug when creating', () => {
		type('title', 'Season 7');
		type('slug', 'Season 7');
		button('Create collection').click();
		fixture.detectChanges();

		httpTesting.expectNone({ method: 'POST', url: COLLECTIONS_URL });
		expect(element.querySelector('.problem')?.textContent).toContain(
			'lowercase letters'
		);
	});

	it('renames a collection when its title is changed', () => {
		const title = element.querySelector<HTMLInputElement>('input.title')!;
		title.value = 'Season Five';
		title.dispatchEvent(new Event('blur'));

		const update = httpTesting.expectOne(`${COLLECTIONS_URL}/season5`);
		expect(update.request.body).toEqual({
			title: 'Season Five',
			startingRevision: 1
		});
		update.flush({});
		httpTesting.expectOne(COLLECTIONS_URL).flush([]);
	});

	it('says when the slug is taken', () => {
		type('title', 'Again');
		type('slug', 'season5');
		button('Create collection').click();
		httpTesting
			.expectOne({ method: 'POST', url: COLLECTIONS_URL })
			.flush({ error: 'taken' }, { status: 409, statusText: 'Conflict' });
		httpTesting
			.expectOne(COLLECTIONS_URL)
			.flush(EDITOR_GALLERY_COLLECTIONS);

		expect(notifyFailure).toHaveBeenCalledWith(
			'The slug season5 is taken. Choose another.'
		);
	});

	it('says how many items a delete takes with it, then deletes', () => {
		button('Delete Season 5').click();

		expect(dialogMessages).toEqual([
			"This deletes the collection and the 3 images in it. It can't be undone."
		]);
		httpTesting
			.expectOne(`${COLLECTIONS_URL}/season5?startingRevision=1`)
			.flush(null);
		httpTesting.expectOne(COLLECTIONS_URL).flush([]);
	});

	it('shows and hides a collection', () => {
		button('Hide Season 5').click();

		const update = httpTesting.expectOne(`${COLLECTIONS_URL}/season5`);
		expect(update.request.body).toEqual({
			visible: false,
			startingRevision: 1
		});
		update.flush({});
		httpTesting.expectOne(COLLECTIONS_URL).flush([]);
	});
});
