import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { CollectionsStore } from './collections-store';

const URL = `${environment.API_URL}/editor/gallery/collections`;

describe('CollectionsStore', () => {
	it('fetches a type once for every reader, and again on reload', () => {
		TestBed.configureTestingModule({
			providers: [
				CollectionsStore,
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: AdminNotifier, useValue: {} }
			]
		});
		const store = TestBed.inject(CollectionsStore);
		const http = TestBed.inject(HttpTestingController);

		const first = store.collections('gallery');
		const second = store.collections('gallery');
		http.expectOne(URL).flush(EDITOR_GALLERY_COLLECTIONS);
		expect(second()).toEqual(EDITOR_GALLERY_COLLECTIONS);

		store.reload('gallery');
		http.expectOne(URL).flush([]);
		expect(first()).toEqual([]);
		http.verify();
	});
});
