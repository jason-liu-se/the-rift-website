import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { ApiStatusMonitor } from 'src/app/core/api/api-status/api-status-monitor';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { GalleryBulkCreate } from './gallery-bulk-create';
import { CollectionsStore } from '../../collections-store';

const EDITOR_URL = `${environment.API_URL}/editor`;

describe('GalleryBulkCreate', () => {
	let fixture: ComponentFixture<GalleryBulkCreate>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let notify: ReturnType<typeof vi.fn>;

	const component = () =>
		fixture.componentInstance as unknown as {
			allCollection: { set(value: string): void };
			setAll(field: string): void;
			pastedLinks: { set(value: string): void };
			addLinks(): void;
		};
	const rows = () => [...element.querySelectorAll('li.row')];
	const button = (text: RegExp) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => text.test(candidate.textContent ?? '')
		)!;
	function pickFiles(...names: string[]) {
		const input: HTMLInputElement =
			element.querySelector('input[type="file"]')!;
		const files = names.map(
			(name) => new File(['x'], name, { type: 'image/png' })
		);
		Object.defineProperty(input, 'files', {
			value: files,
			configurable: true
		});
		input.dispatchEvent(new Event('change'));
		fixture.detectChanges();
	}

	beforeEach(() => {
		notify = vi.fn();
		URL.createObjectURL = vi.fn(() => 'blob:preview');
		URL.revokeObjectURL = vi.fn();
		TestBed.configureTestingModule({
			imports: [GalleryBulkCreate],
			providers: [
				CollectionsStore,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ApiStatusMonitor,
					useValue: { status: signal('up') }
				},
				{ provide: AdminNotifier, useValue: { notify } }
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		// Loaded already, as by the list page behind the modal.
		TestBed.inject(CollectionsStore).collections('gallery');
		httpTesting
			.expectOne(`${EDITOR_URL}/gallery/collections`)
			.flush(EDITOR_GALLERY_COLLECTIONS);
		fixture = TestBed.createComponent(GalleryBulkCreate);
		element = fixture.nativeElement;
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it('makes a row per file, with a caption from its name', () => {
		pickFiles('spawn_walkway.png', 'iron-farm.png');

		expect(rows()).toHaveLength(2);
		const rowModels = (
			fixture.componentInstance as unknown as {
				rows(): { caption: string }[];
			}
		).rows();
		expect(rowModels.map((row) => row.caption)).toEqual([
			'Spawn walkway',
			'Iron farm'
		]);
	});

	it('uploads every file into its collection, publishes them in one request, and keeps only the failures', () => {
		pickFiles('one.png', 'two.png');
		component().allCollection.set('season5');
		component().setAll('collection');
		fixture.detectChanges();

		button(/Upload and publish 2 images/).click();

		const upload = httpTesting.expectOne(`${EDITOR_URL}/images`);
		const form = upload.request.body as FormData;
		expect(form.get('collection')).toBe('season5');
		expect(form.getAll('files')).toHaveLength(2);
		upload.flush({
			results: [
				{ name: 'one.png', url: 'https://i.ibb.co/a/one.png' },
				{ name: 'two.png', url: 'https://i.ibb.co/a/two.png' }
			]
		});

		const create = httpTesting.expectOne(
			`${EDITOR_URL}/gallery/images/bulk`
		);
		const items = create.request.body.items;
		expect(items.map((item: { caption: string }) => item.caption)).toEqual([
			'One',
			'Two'
		]);
		expect(items[0]).toEqual(
			expect.objectContaining({
				collection: 'season5',
				imageUrl: 'https://i.ibb.co/a/one.png',
				visible: true,
				tags: []
			})
		);
		create.flush({
			results: [
				{ id: items[0].createId, outcome: 'ok' },
				{
					id: items[1].createId,
					outcome: 'invalid',
					reason: 'caption: too long'
				}
			]
		});
		fixture.detectChanges();

		expect(rows()).toHaveLength(1);
		expect(rows()[0].querySelector('.problem')?.textContent).toBe(
			'caption: too long'
		);
		expect(notify).toHaveBeenCalledWith({
			message:
				"Published 1 image. 1 wasn't: 1 invalid (caption: too long).",
			hasFailures: true
		});
	});

	it('retries a failed row without uploading it again, with the same createId', () => {
		pickFiles('one.png');
		component().allCollection.set('season5');
		component().setAll('collection');
		fixture.detectChanges();
		button(/Upload and publish/).click();
		httpTesting.expectOne(`${EDITOR_URL}/images`).flush({
			results: [{ name: 'one.png', url: 'https://i.ibb.co/a/one.png' }]
		});
		const first = httpTesting.expectOne(
			`${EDITOR_URL}/gallery/images/bulk`
		);
		const createId = first.request.body.items[0].createId;
		first.flush(null, { status: 500, statusText: 'Server Error' });
		fixture.detectChanges();

		button(/Upload and publish/).click();

		const retry = httpTesting.expectOne(
			`${EDITOR_URL}/gallery/images/bulk`
		);
		expect(retry.request.body.items[0].createId).toBe(createId);
		retry.flush({ results: [{ id: createId, outcome: 'ok' }] });
		fixture.detectChanges();
		expect(rows()).toHaveLength(0);
	});

	it('flags rows that are not ready, without sending them', () => {
		component().pastedLinks.set(
			'https://example.com/x.png\nhttps://i.ibb.co/a/y.png'
		);
		component().addLinks();
		fixture.detectChanges();

		button(/Upload and publish 2 images/).click();
		fixture.detectChanges();

		const problems = rows().map(
			(row) => row.querySelector('.problem')?.textContent
		);
		expect(problems).toEqual([
			'Choose a collection.',
			'Choose a collection.'
		]);
		httpTesting.expectNone(`${EDITOR_URL}/gallery/images/bulk`);
	});
});
