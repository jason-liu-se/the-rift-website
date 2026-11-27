import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EditorNewsPost } from 'src/app/core/api/api-responses';
import { AdminNotifierService } from 'src/app/features/admin/admin-notifier.service';
import { DraftSession } from '../drafts/draft-session';
import { DraftEditor } from './draft-editor';
import { PublishSettings, providePublishSettings } from './publish-settings';

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
		fields: signal<object>({
			title: 'Mine',
			content: 'Body',
			visible: false
		}),
		status: signal('saved'),
		conflict: signal<unknown>(undefined),
		mergeReference: signal<unknown>(undefined),
		hasChanges: signal(true),
		hasUnpublishedChanges: signal(true),
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

describe('DraftEditor', () => {
	let fixture: ComponentFixture<DraftEditor<'news'>>;
	let session: ReturnType<typeof fakeSession>;
	let element: HTMLElement;

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
						visible.textContent?.trim()) === name
				);
			}
		)!;
	const text = () => element.textContent?.replace(/\s+/g, ' ') ?? '';

	beforeEach(async () => {
		session = fakeSession();
		TestBed.configureTestingModule({
			imports: [DraftEditor],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				providePublishSettings(),
				{
					provide: AdminNotifierService,
					useValue: {
						notify: vi.fn(),
						notifySuccess: vi.fn(),
						notifyFailure: vi.fn()
					}
				},
				{
					provide: MatDialog,
					useValue: { open: () => ({ afterClosed: () => of(true) }) }
				}
			]
		});
		fixture = TestBed.createComponent(DraftEditor<'news'>);
		fixture.componentRef.setInput(
			'session',
			session as unknown as DraftSession<'news'>
		);
		TestBed.inject(PublishSettings).reset({ date: THEIRS.date });
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

	it("publishes with the draft's visibility and the published date by default", () => {
		button('Save as hidden').click();

		// The draft carries `visible`; a request without one uses it.
		expect(session.publish).toHaveBeenCalledWith({});
	});

	it("won't publish until the required fields are filled in", () => {
		session.fields.set({ title: 'Mine', content: '', visible: false });
		fixture.detectChanges();

		button('Save as hidden').click();
		fixture.detectChanges();

		expect(session.publish).not.toHaveBeenCalled();
		expect(text()).toContain('Fields marked * are required.');
	});

	it('shows their version when the item changed, to overwrite or merge', () => {
		session.conflict.set({ kind: 'item', theirs: THEIRS });
		fixture.detectChanges();

		expect(text()).toContain('Someone published changes to this post');
		expect(text()).toContain('Their title');
		expect(button('Save as hidden').disabled).toBe(true);

		button('Replace with mine').click();
		expect(session.resolveItemConflict).toHaveBeenCalledWith('overwrite');
		expect(session.publish).toHaveBeenCalled();
	});

	it('offers to publish as new, or discard, when the item was deleted', () => {
		session.conflict.set({ kind: 'deleted' });
		fixture.detectChanges();

		button('Publish as new').click();

		expect(session.publishAsNew).toHaveBeenCalledWith({});
	});

	it('discards the changes once confirmed', () => {
		const closed = vi.fn();
		fixture.componentInstance.closed.subscribe(closed);

		button('Discard changes').click();

		expect(session.discard).toHaveBeenCalled();
		expect(closed).toHaveBeenCalled();
	});
});
