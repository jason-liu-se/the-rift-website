import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
	Component,
	DestroyRef,
	WritableSignal,
	inject,
	input,
	linkedSignal
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { pngFileName, saveFile, toPng } from './png-file';

/** How long a button shows "Copied" or a failure before going back. */
const FEEDBACK_MS = 3000;

type ActionState = 'idle' | 'busy' | 'done' | 'failed';

/** Buttons to copy an image's original link and download it as a PNG. */
@Component({
	selector: 'app-image-actions',
	templateUrl: './image-actions.component.html',
	styleUrl: './image-actions.component.scss',
	imports: [MatIcon]
})
export class ImageActionsComponent {
	/** The original file's URL; relative URLs are resolved against the site. */
	public readonly imageUrl = input.required<string>();

	protected readonly copyState = this.stateFor(this.imageUrl);
	protected readonly downloadState = this.stateFor(this.imageUrl);

	private readonly document = inject(DOCUMENT);
	private readonly http = inject(HttpClient);
	private readonly clipboard = inject(Clipboard);
	private readonly announcer = inject(LiveAnnouncer);
	private readonly resetTimers = new Map<
		WritableSignal<ActionState>,
		ReturnType<typeof setTimeout>
	>();

	constructor() {
		inject(DestroyRef).onDestroy(() =>
			this.resetTimers.forEach(clearTimeout)
		);
	}

	protected copyLink(): void {
		const copied = this.clipboard.copy(this.absoluteUrl());
		this.show(this.copyState, copied ? 'done' : 'failed');
		void this.announcer.announce(
			copied ? 'Image link copied' : "Couldn't copy the image link"
		);
	}

	protected async downloadPng(): Promise<void> {
		if (this.downloadState() === 'busy') {
			return;
		}

		const url = this.absoluteUrl();
		// Still saves the image clicked, but leaves the button alone if the
		// slideshow has moved on to another one meanwhile.
		const isShown = () => this.absoluteUrl() === url;
		this.downloadState.set('busy');
		try {
			const image = await firstValueFrom(
				this.http.get(url, { responseType: 'blob' })
			);
			saveFile(await toPng(image), pngFileName(url), this.document);
			if (isShown()) {
				this.downloadState.set('idle');
				void this.announcer.announce('Download started');
			}
		} catch {
			// The image's host doesn't allow cross-origin reads (CORS), or the
			// browser lacks OffscreenCanvas (Safari before 16.4).
			if (isShown()) {
				this.show(this.downloadState, 'failed');
				void this.announcer.announce("Couldn't download the image");
			}
		}
	}

	private absoluteUrl(): string {
		return new URL(this.imageUrl(), this.document.baseURI).href;
	}

	/** Shows a result on a button, then returns it to idle. */
	private show(
		state: WritableSignal<ActionState>,
		result: ActionState
	): void {
		state.set(result);
		clearTimeout(this.resetTimers.get(state));
		this.resetTimers.set(
			state,
			setTimeout(() => state.set('idle'), FEEDBACK_MS)
		);
	}

	/** A button's state, reset whenever the image changes. */
	private stateFor(source: () => string): WritableSignal<ActionState> {
		return linkedSignal<string, ActionState>({
			source,
			computation: () => 'idle'
		});
	}
}
