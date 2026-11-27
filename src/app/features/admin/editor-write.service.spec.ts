import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, throwError } from 'rxjs';
import { AdminNotifierService } from 'src/app/features/admin/admin-notifier.service';
import { EditorWriteService } from './editor-write.service';

const CONFIRM = { title: 'Delete?', message: 'Sure?', confirmLabel: 'Delete' };

describe('EditorWriteService', () => {
	it.each<{
		case: string;
		isConfirmed?: boolean;
		request: Observable<unknown>;
		emitted: boolean[];
		isSent: boolean;
		notified: string[];
	}>([
		{
			case: 'sends and confirms success',
			request: of({}),
			emitted: [true],
			isSent: true,
			notified: ['success:Done.']
		},
		{
			case: 'counts a request that completes empty as success',
			request: new Observable<never>((subscriber) =>
				subscriber.complete()
			),
			emitted: [true],
			isSent: true,
			notified: ['success:Done.']
		},
		{
			case: 'says why a failure failed',
			request: throwError(() => new Error('boom')),
			emitted: [false],
			isSent: true,
			notified: ['failure:boom']
		},
		{
			case: 'sends nothing once cancelled',
			isConfirmed: false,
			request: of({}),
			emitted: [],
			isSent: false,
			notified: []
		}
	])('$case', ({ isConfirmed, request, emitted, isSent, notified }) => {
		const messages: string[] = [];
		TestBed.configureTestingModule({
			providers: [
				{
					provide: AdminNotifierService,
					useValue: {
						notifySuccess: (message: string) =>
							messages.push(`success:${message}`),
						notifyFailure: (message: string) =>
							messages.push(`failure:${message}`)
					}
				},
				{
					provide: MatDialog,
					useValue: {
						open: () => ({ afterClosed: () => of(isConfirmed) })
					}
				}
			]
		});
		let wasSent = false;
		const results: boolean[] = [];

		TestBed.inject(EditorWriteService)
			.run({
				confirm: isConfirmed === undefined ? undefined : CONFIRM,
				request: () => {
					wasSent = true;
					return request;
				},
				success: 'Done.',
				describeFailure: (error) => (error as Error).message
			})
			.subscribe((result) => results.push(result));

		expect(results).toEqual(emitted);
		expect(wasSent).toBe(isSent);
		expect(messages).toEqual(notified);
	});
});
