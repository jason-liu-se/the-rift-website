import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EditorNewsPost } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { DraftSession } from '../../drafts/draft-session';
import { DraftEditorComponent } from './draft-editor.component';

const THEIRS = {
	id: 'post-1',
	title: 'Their title',
	content: 'Their content',
	date: '2026-01-01T12:00:00.000Z',
	status: 'live',
	visible: true,
	revision: 5
} as EditorNewsPost;

/** A session stand-in: the editor only reads its signals and calls it. */
function fakeSession() {
	return {
		type: 'news' as const,
		fields: signal({ title: 'Mine' }),
		status: signal('saved'),
		conflict: signal<unknown>(undefined),
		mergeReference: signal<unknown>(undefined),
		hasChanges: signal(true),
		canUndo: signal(true),
		canRedo: signal(false),
		undo: vi.fn(),
		redo: vi.fn(),
		publish: vi.fn(() => of(THEIRS)),
		publishAsNew: vi.fn(() => of(THEIRS)),
		resolveItemConflict: vi.fn(() => of(undefined)),
		resolveDraftConflict: vi.fn(() => of(undefined)),
		saveNow: vi.fn(() => of(undefined)),
		discard: vi.fn(() => of(undefined)),
		close: vi.fn()
	};
}

describe('DraftEditorComponent', () => {
	let fixture: ComponentFixture<DraftEditorComponent<'news'>>;
	let session: ReturnType<typeof fakeSession>;
	let element: HTMLElement;

	const button = (name: string) =>
		[...element.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => candidate.textContent?.trim() === name
		)!;
	const text = () => element.textContent?.replace(/\s+/g, ' ') ?? '';

	beforeEach(async () => {
		session = fakeSession();
		TestBed.configureTestingModule({
			imports: [DraftEditorComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AdminNotifierService,
					useValue: { notifySuccess: vi.fn(), notifyFailure: vi.fn() }
				},
				{
					provide: MatDialog,
					useValue: { open: () => ({ afterClosed: () => of(true) }) }
				}
			]
		});
		fixture = TestBed.createComponent(DraftEditorComponent<'news'>);
		fixture.componentRef.setInput(
			'session',
			session as unknown as DraftSession<'news'>
		);
		fixture.componentRef.setInput('published', {
			visible: false,
			date: THEIRS.date
		});
		element = fixture.nativeElement;
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	});

	it('shows the save status, the changes tell, and undo/redo', () => {
		expect(text()).toContain('Unpublished changes');
		expect(text()).toContain('Saved');
		expect(button('Redo').disabled).toBe(true);

		button('Undo').click();
		expect(session.undo).toHaveBeenCalled();
	});

	it("publishes with the published item's visibility and date by default", () => {
		button('Publish').click();

		expect(session.publish).toHaveBeenCalledWith({ visible: false });
	});

	it('shows their version when the item changed, to overwrite or merge', () => {
		session.conflict.set({ kind: 'item', theirs: THEIRS });
		fixture.detectChanges();

		expect(text()).toContain('This post changed since you started.');
		expect(text()).toContain('Their title');
		expect(button('Publish').disabled).toBe(true);

		button('Overwrite with mine').click();
		expect(session.resolveItemConflict).toHaveBeenCalledWith('overwrite');
		expect(session.publish).toHaveBeenCalled();
	});

	it('offers to publish as new, or discard, when the item was deleted', () => {
		session.conflict.set({ kind: 'deleted' });
		fixture.detectChanges();

		button('Publish as new').click();

		expect(session.publishAsNew).toHaveBeenCalledWith({ visible: false });
	});

	it('discards the draft once confirmed', () => {
		const closed = vi.fn();
		fixture.componentInstance.closed.subscribe(closed);

		button('Discard draft').click();

		expect(session.discard).toHaveBeenCalled();
		expect(closed).toHaveBeenCalled();
	});
});
