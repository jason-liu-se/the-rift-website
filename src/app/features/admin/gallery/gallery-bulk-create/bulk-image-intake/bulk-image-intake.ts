import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { UPLOAD_IMAGE_TYPES } from 'src/app/core/config/uploads';
import { FileDrop } from '../../../image-upload/file-drop';
import { parsePastedLinks } from '../bulk-image-rows';

/** Where bulk creation's images come in: dropped, chosen, or pasted links. */
@Component({
	selector: 'app-bulk-image-intake',
	templateUrl: './bulk-image-intake.html',
	styleUrl: './bulk-image-intake.scss',
	imports: [
		FileDrop,
		FormsModule,
		MatButton,
		MatFormField,
		MatIcon,
		MatInput,
		MatLabel
	]
})
export class BulkImageIntake {
	public readonly canUpload = input.required<boolean>();
	public readonly filesAdded = output<File[]>();
	public readonly linksAdded = output<string[]>();

	protected readonly acceptedTypes = UPLOAD_IMAGE_TYPES.join(',');
	protected readonly pastedLinks = signal('');

	protected addChosenFiles(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		this.filesAdded.emit(files);
	}

	protected addLinks(): void {
		this.linksAdded.emit(parsePastedLinks(this.pastedLinks()));
		this.pastedLinks.set('');
	}
}
