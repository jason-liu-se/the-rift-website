import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DraftHistory } from './draft-history';

describe('DraftHistory shortcuts', () => {
	let session: {
		canUndo: ReturnType<typeof signal<boolean>>;
		canRedo: ReturnType<typeof signal<boolean>>;
		undo: ReturnType<typeof vi.fn>;
		redo: ReturnType<typeof vi.fn>;
	};
	let modal: HTMLElement;
	let field: HTMLInputElement;
	let otherDialog: HTMLElement;

	const press = (target: HTMLElement, keys: KeyboardEventInit) => {
		const event = new KeyboardEvent('keydown', {
			...keys,
			bubbles: true,
			cancelable: true
		});
		target.dispatchEvent(event);
		return event;
	};

	beforeEach(() => {
		session = {
			canUndo: signal(true),
			canRedo: signal(true),
			undo: vi.fn(),
			redo: vi.fn()
		};
		const fixture = TestBed.createComponent(DraftHistory);
		fixture.componentRef.setInput('session', session);
		fixture.detectChanges();
		// In its modal beside a text field, with another dialog over it.
		modal = document.createElement('div');
		modal.setAttribute('role', 'dialog');
		field = document.createElement('input');
		modal.append(fixture.nativeElement, field);
		otherDialog = document.createElement('div');
		otherDialog.setAttribute('role', 'dialog');
		document.body.replaceChildren(modal, otherDialog);
	});

	it.each([
		{ keys: { key: 'z', ctrlKey: true }, runs: 'undo' },
		{ keys: { key: 'z', metaKey: true }, runs: 'undo' },
		{ keys: { key: 'Z', ctrlKey: true, shiftKey: true }, runs: 'redo' },
		{ keys: { key: 'y', ctrlKey: true }, runs: 'redo' },
		{ keys: { key: 'z' }, runs: 'nothing' },
		{ keys: { key: 'z', ctrlKey: true, altKey: true }, runs: 'nothing' }
	])('runs $runs on $keys', ({ keys, runs }) => {
		for (const target of [field, modal]) {
			session.undo.mockClear();
			session.redo.mockClear();
			const event = press(target, keys);

			expect(session.undo).toHaveBeenCalledTimes(runs === 'undo' ? 1 : 0);
			expect(session.redo).toHaveBeenCalledTimes(runs === 'redo' ? 1 : 0);
			// A text field's own undo would be a second history.
			expect(event.defaultPrevented).toBe(runs !== 'nothing');
		}
	});

	it("blocks a text field's own undo with nothing to undo", () => {
		session.canUndo.set(false);
		const event = press(field, { key: 'z', ctrlKey: true });

		expect(session.undo).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});

	it('leaves keys from another dialog alone', () => {
		const event = press(otherDialog, { key: 'z', ctrlKey: true });

		expect(session.undo).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});
});
