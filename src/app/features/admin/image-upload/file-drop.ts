import { Directive, input, output, signal } from '@angular/core';

/**
 * Takes files dropped on its element while `appFileDrop` is true, marking it
 * `dragging` while files are over it. Anything else dragged is left alone.
 */
@Directive({
	selector: '[appFileDrop]',
	host: {
		'[class.dragging]': 'isDragging()',
		'(dragover)': 'allowDrop($event)',
		'(dragleave)': 'isDragging.set(false)',
		'(drop)': 'takeDropped($event)'
	}
})
export class FileDrop {
	/** Whether files can be dropped now. */
	public readonly appFileDrop = input.required<boolean>();
	public readonly filesDropped = output<File[]>();

	protected readonly isDragging = signal(false);

	protected allowDrop(event: DragEvent): void {
		if (this.appFileDrop() && event.dataTransfer?.types.includes('Files')) {
			event.preventDefault();
			this.isDragging.set(true);
		}
	}

	protected takeDropped(event: DragEvent): void {
		this.isDragging.set(false);
		if (this.appFileDrop() && event.dataTransfer?.files.length) {
			event.preventDefault();
			this.filesDropped.emit([...event.dataTransfer.files]);
		}
	}
}
