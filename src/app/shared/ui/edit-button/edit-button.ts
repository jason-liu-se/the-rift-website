import { Component, computed, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ADMIN_PATH } from 'src/app/core/config/admin';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { AuthService } from 'src/app/core/auth/auth.service';

/**
 * "Edit" on a piece of public content, for logged-in editors only: opens the
 * item in its admin tool's editor in a new tab. The server never knows the
 * user, so server-rendered HTML never has it.
 */
@Component({
	selector: 'app-edit-button',
	templateUrl: './edit-button.html',
	styleUrl: './edit-button.scss',
	imports: [MatIcon]
})
export class EditButton {
	private user = inject(AuthService).user;

	public readonly type = input.required<EditorContentType>();
	public readonly itemId = input.required<string>();
	/** What's edited, for screen readers: "Edit Season 6". */
	public readonly itemName = input.required<string>();

	protected readonly isEditor = computed(() => !!this.user());
	protected readonly href = computed(
		() =>
			`${ADMIN_PATH}/${this.type()}/${encodeURIComponent(this.itemId())}`
	);
}
