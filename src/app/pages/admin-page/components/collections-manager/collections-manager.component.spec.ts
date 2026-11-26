import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AUTOSAVE_DELAY_MS } from 'src/app/config/admin';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { CollectionsStore } from '../../services/collections-store.service';
import { findSlugProblem, toSlug } from '../collection-form/collection-slug';
import { CollectionsEditor } from '../collections-modal/collections-editor';
import { ModalFooterSlot } from '../modal-shell/modal-footer-slot';
import { CollectionsManagerComponent } from './collections-manager.component';

/** The manager as the Collections modal shows it, its form's footer below. */
@Component({
	template: `<app-collections-manager
			type="gallery"
			[itemNoun]="{ one: 'image', many: 'images' }"
		/>
		<ng-container *ngTemplateOutlet="footer.template() ?? null" />`,
	imports: [CollectionsManagerComponent, NgTemplateOutlet],
	providers: [CollectionsEditor, ModalFooterSlot]
})
class ModalHostComponent {
	protected readonly footer = inject(ModalFooterSlot);

	constructor() {
		inject(CollectionsEditor).start('gallery');
	}
}

const COLLECTIONS_URL = `${environment.API_URL}/editor/gallery/collections`;
const DRAFTS_URL = `${environment.API_URL}/editor/drafts`;
const LIST_DRAFTS = {
	method: 'GET',
	url: `${DRAFTS_URL}?type=gallery-collections`
};

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
	let fixture: ComponentFixture<ModalHostComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let dialogMessages: string[];
	let notifyFailure: ReturnType<typeof vi.fn>;

	/** A button by its accessible name: its label, or its text without icons and hidden text. */
	const button = (name: string) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => {
				const visible = candidate.cloneNode(true) as HTMLElement;
				visible
					.querySelectorAll('mat-icon, [aria-hidden="true"]')
					.forEach((hidden) => hidden.remove());
				return (
					(candidate.getAttribute('aria-label') ??
						visible.textContent?.replace(/\s+/g, ' ').trim()) ===
					name
				);
			}
		)!;
	const type = (name: string, value: string) => {
		const input = element.querySelector<HTMLInputElement>(
			`input[name="${name}"]`
		)!;
		input.value = value;
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
	};
	/** Answers the draft's save, then expects its publish. */
	const expectPublish = () => {
		const save = httpTesting.expectOne({ method: 'PUT' });
		const { body } = save.request;
		save.flush({
			...body,
			id: save.request.url.split('/').pop(),
			revision: 1
		});
		return {
			save: body,
			publish: httpTesting.expectOne({ method: 'POST' })
		};
	};

	beforeEach(() => {
		localStorage.clear();
		dialogMessages = [];
		notifyFailure = vi.fn();
		TestBed.configureTestingModule({
			imports: [ModalHostComponent],
			providers: [
				CollectionsStore,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: 'me' }) }
				},
				{
					provide: AdminNotifierService,
					useValue: {
						notifySuccess: vi.fn(),
						notifyFailure,
						notifyWithUndo: vi.fn()
					}
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
		fixture = TestBed.createComponent(ModalHostComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
		httpTesting.expectOne(LIST_DRAFTS).flush([]);
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

	it('fills the slug in from the title, and publishes the new collection', () => {
		type('title', 'Season 7');
		button('Publish').click();

		const { save, publish } = expectPublish();
		expect(save).toEqual({
			type: 'gallery-collections',
			fields: { slug: 'season-7', title: 'Season 7', visible: true }
		});
		publish.flush({ slug: 'season-7', title: 'Season 7' });
		httpTesting
			.expectOne(COLLECTIONS_URL)
			.flush(EDITOR_GALLERY_COLLECTIONS);
		httpTesting.expectOne(LIST_DRAFTS).flush([]);
	});

	it("won't publish a bad slug, or a dimension without a name and image", () => {
		type('title', 'Season 7');
		type('slug', 'Season 7');
		button('Add a dimension').click();
		fixture.detectChanges();
		button('Publish').click();
		fixture.detectChanges();

		httpTesting.expectNone({ method: 'PUT' });
		expect(element.textContent).toContain('lowercase letters');
		expect(element.textContent).toContain(
			'Give every dimension a name and an image.'
		);
	});

	it("edits a collection's dimensions in its draft, from its Edit button", () => {
		button('Edit Season 5').click();
		httpTesting.expectOne(LIST_DRAFTS).flush([]);
		fixture.detectChanges();
		button('Remove Nether').click();
		fixture.detectChanges();
		button('Publish changes').click();

		const { save } = expectPublish();
		expect(save.target).toEqual({ id: 'season5', startingRevision: 1 });
		expect(save.fields.dimensions).toEqual([
			{
				name: 'Overworld',
				imageUrl: '/assets/general-background-images/fancy-tree-1.webp'
			}
		]);
		httpTesting.match({ method: 'POST' });
	});

	it('renames a collection in its draft, publishing nothing', () => {
		const title = element.querySelector<HTMLInputElement>('input.title')!;
		title.value = 'Season Five';
		title.dispatchEvent(new Event('blur'));
		httpTesting.expectOne(LIST_DRAFTS).flush([]);
		fixture.detectChanges();

		expect(element.textContent).toContain('Unpublished changes');
		httpTesting.expectNone({ method: 'PATCH' });
	});

	it('keeps listing a new collection once its draft is saved', () => {
		vi.useFakeTimers();
		type('title', 'Season 7');
		vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
		vi.useRealTimers();
		const save = httpTesting.expectOne({ method: 'PUT' });
		const draft = {
			...save.request.body,
			id: save.request.url.split('/').pop(),
			revision: 1
		};
		save.flush(draft);
		fixture.detectChanges();

		expect(button('Season 7')).toBeDefined();
		httpTesting.expectOne(LIST_DRAFTS).flush([draft]);
		fixture.detectChanges();
		expect(button('Season 7')).toBeDefined();
	});

	it('says when the slug is taken', () => {
		type('title', 'Again');
		type('slug', 'season5');
		button('Publish').click();
		expectPublish().publish.flush(
			{ error: 'taken' },
			{ status: 409, statusText: 'Conflict' }
		);

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
});
