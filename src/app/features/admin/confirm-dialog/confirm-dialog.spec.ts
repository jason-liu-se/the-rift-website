import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { confirmAction } from './confirm-dialog';

describe('confirmAction', () => {
	function open(): { confirmed: () => boolean | undefined } {
		TestBed.configureTestingModule({});
		let confirmed: boolean | undefined;
		confirmAction(TestBed.inject(MatDialog), {
			title: 'Delete 2 posts?',
			message: "This can't be undone.",
			confirmLabel: 'Delete 2 posts'
		}).subscribe((result) => (confirmed = result));
		TestBed.tick();
		return { confirmed: () => confirmed };
	}

	const button = (name: string) =>
		[...document.querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => candidate.textContent?.trim() === name
		)!;

	/** Clicks a button and waits for the dialog to close. */
	async function click(name: string): Promise<void> {
		button(name).click();
		TestBed.tick();
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	afterEach(() => TestBed.inject(MatDialog).closeAll());

	it('shows the question as an alert dialog', async () => {
		open();

		const dialog = document.querySelector('[role="alertdialog"]');
		expect(dialog?.textContent).toContain('Delete 2 posts?');
		expect(dialog?.textContent).toContain("This can't be undone.");
	});

	it('resolves to true only when confirmed', async () => {
		const { confirmed } = open();
		await click('Delete 2 posts');

		expect(confirmed()).toBe(true);
	});

	it('resolves to false when cancelled', async () => {
		const { confirmed } = open();
		await click('Cancel');

		expect(confirmed()).toBe(false);
	});
});
