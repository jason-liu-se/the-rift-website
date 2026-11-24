import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AuthService } from 'src/app/services/auth/auth.service';
import { EditorAvatarComponent } from '../../editor-avatar/editor-avatar.component';
import { StatusBadgeComponent } from '../../status-badge/status-badge.component';
import { EditorListActions } from '../editor-list.actions';
import { EditorListStore } from '../editor-list.store';
import { ListRow } from '../list-rows';

/**
 * One row of an admin list, a published item or a draft alike: select it,
 * open it (a click anywhere on it, or Enter), or its menu's actions.
 */
@Component({
	// A table's rows must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tr[app-editor-row]',
	templateUrl: './editor-row.component.html',
	styleUrl: './editor-row.component.scss',
	imports: [
		EditorAvatarComponent,
		MatCheckbox,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		NgComponentOutlet,
		StatusBadgeComponent
	],
	host: {
		tabindex: '0',
		// Ctrl+A's preview shows every row on the page as selected.
		'[class.selected]':
			'isSelected() || store.selection.isPreviewingPage()',
		'(click)': 'openFromRow($event)',
		'(keydown.enter)': 'openFromRow($event)'
	}
})
export class EditorRowComponent {
	protected readonly store = inject(EditorListStore);
	private user = inject(AuthService).user;

	public readonly row = input.required<ListRow>();

	protected readonly actions = inject(EditorListActions);
	protected readonly itemCell = computed(() => this.store.config().itemCell);
	/** The editor, who made every draft listed. */
	protected readonly currentUser = computed(() => this.user() ?? undefined);
	protected readonly isSelected = computed(() => {
		const row = this.row();
		return row.kind === 'draft'
			? this.store.selection.isDraftSelected(row.id)
			: this.store.selection.isSelected(row.id);
	});

	protected toggleSelected(): void {
		const row = this.row();
		if (row.kind === 'draft') {
			this.store.selection.toggleDraft(row.id);
		} else {
			this.store.selection.toggle(row.ref, this.store.pageRows());
		}
	}

	protected open(): void {
		this.store.open(this.row());
	}

	/** Opens the row unless the click was on one of its own controls. */
	protected openFromRow(event: Event): void {
		const target = event.target as HTMLElement;
		if (!target.closest('a, button, input, label, mat-checkbox')) {
			this.open();
		}
	}
}
