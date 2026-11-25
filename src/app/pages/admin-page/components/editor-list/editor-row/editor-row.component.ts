import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import {
	MatContextMenuTrigger,
	MatMenu,
	MatMenuItem,
	MatMenuTrigger
} from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { formatRelativeTime } from 'src/app/utilities/relative-time';
import { formatDateTime } from '../../../utilities/format-date-time';
import { EditorAvatarComponent } from '../../editor-avatar/editor-avatar.component';
import { StatusBadgeComponent } from '../../status-badge/status-badge.component';
import { EditorListActions } from '../editor-list.actions';
import { EditorListStore } from '../editor-list.store';
import { ListRow } from '../list-rows';

/**
 * One row of an admin list, a published item or a draft alike: select it,
 * open it (its name's link, or a click anywhere on it), or its menu's
 * actions (on a gallery card, also from a right-click).
 */
@Component({
	// A table's rows must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tr[app-editor-row]',
	templateUrl: './editor-row.component.html',
	styleUrl: './editor-row.component.scss',
	imports: [
		CdkDragHandle,
		EditorAvatarComponent,
		MatCheckbox,
		MatContextMenuTrigger,
		MatDivider,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatTooltip,
		NgComponentOutlet,
		StatusBadgeComponent
	],
	host: {
		role: 'row',
		// Ctrl+A's preview shows every row on the page as selected.
		'[class.selected]':
			'isSelected() || store.selection.isPreviewingPage()',
		'(click)': 'openFromRow($event)'
	}
})
export class EditorRowComponent {
	protected readonly store = inject(EditorListStore);
	private user = inject(AuthService).user;
	private clipboard = inject(Clipboard);
	private notifier = inject(AdminNotifierService);

	public readonly row = input.required<ListRow>();

	protected readonly actions = inject(EditorListActions);
	protected readonly itemCell = computed(() => this.store.config().itemCell);
	/** Who last changed it: for a draft, the editor, who made every one listed. */
	protected readonly updatedBy = computed(() => {
		const row = this.row();
		return row.kind === 'item'
			? row.item.lastUpdatedBy
			: (this.user() ?? undefined);
	});
	protected readonly updatedAt = computed(() => {
		const row = this.row();
		return row.kind === 'item' ? row.item.updatedAt : row.draft.updatedAt;
	});
	/** Items older than the edit history have no time. */
	protected readonly updatedAgo = computed(() => {
		const updatedAt = this.updatedAt();
		return updatedAt ? formatRelativeTime(updatedAt) : '';
	});
	protected readonly updatedAtText = computed(() => {
		const updatedAt = this.updatedAt();
		return updatedAt ? formatDateTime(updatedAt) : '';
	});
	/** Its position, while the list can be put in order; else undefined. */
	protected readonly index = computed(() => {
		const row = this.row();
		if (!this.store.isReorderable() || row.kind !== 'item') {
			return undefined;
		}
		return this.store.itemRows().findIndex(({ id }) => id === row.id);
	});
	protected readonly canMoveUp = computed(() => (this.index() ?? 0) > 0);
	protected readonly canMoveDown = computed(() => {
		const index = this.index();
		return index !== undefined && index < this.store.itemRows().length - 1;
	});
	/** Where a live item shows on the site. */
	protected readonly publicPath = computed(() => {
		const row = this.row();
		return row.kind === 'item' && row.item.status === 'live'
			? (this.store.config().publicPath as (item: object) => string)(
					row.item
				)
			: undefined;
	});
	/** A gallery card's image, for its menu's Copy image link. */
	protected readonly imageUrl = computed(() => {
		const row = this.row();
		const fields = row.kind === 'item' ? row.item : row.draft.fields;
		return this.store.isGrid() && 'imageUrl' in fields
			? fields.imageUrl || undefined
			: undefined;
	});
	/** The editor's URL, for the name's link (and opening it in a new tab). */
	protected readonly href = computed(() => {
		// The link keeps the list's query, so it changes with it.
		this.store.filters();
		this.store.pageIndex();
		return this.store.hrefOf(this.row());
	});
	protected readonly isSelected = computed(() => {
		const row = this.row();
		return row.kind === 'draft'
			? this.store.selection.isDraftSelected(row.id)
			: this.store.selection.isSelected(row.id);
	});

	/** Moves it one place up (-1) or down (1): dragging without a pointer. */
	protected move(by: -1 | 1): void {
		const index = this.index();
		if (index !== undefined) {
			this.actions.moveItem(index, index + by);
		}
	}

	protected copyImageUrl(url: string): void {
		if (this.clipboard.copy(url)) {
			this.notifier.notifySuccess('Image link copied');
		} else {
			this.notifier.notifyFailure("Couldn't copy the image link");
		}
	}

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

	/** Opens in the modal, unless asked for a new tab or window. */
	protected openFromLink(event: MouseEvent): void {
		if (event.ctrlKey || event.metaKey || event.shiftKey || event.button) {
			return;
		}
		event.preventDefault();
		this.open();
	}

	/** Opens the row unless the click was on one of its own controls. */
	protected openFromRow(event: Event): void {
		const target = event.target as HTMLElement;
		if (!target.closest('a, button, input, label, mat-checkbox')) {
			this.open();
		}
	}
}
