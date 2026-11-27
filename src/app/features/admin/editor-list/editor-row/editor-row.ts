import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';
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
import { ListColumn } from '../list-columns';
import { RowLayout, RowMenuItem } from '../row-actions';
import { ListRow } from '../list-rows';

/**
 * One row of an admin list, a published item or a draft alike: a checkbox,
 * a cell per column (see `ListColumn`), and a menu. Select it, open it (its
 * title's link, or a click anywhere on it), or use its menu's actions (from
 * its button, or a right-click anywhere on it).
 */
@Component({
	// A table's rows must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tr[app-editor-row]',
	templateUrl: './editor-row.html',
	styleUrl: './editor-row.scss',
	imports: [
		CdkDragHandle,
		MatCheckbox,
		MatContextMenuTrigger,
		MatDivider,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatTooltip,
		NgComponentOutlet
	],
	host: {
		role: 'row',
		'[class.selected]': 'isSelected()',
		'[class.card]': "layout() === 'card'",
		'(click)': 'openFromRow($event)'
	}
})
export class EditorRow {
	public readonly row = input.required<ListRow>();
	/** Cards on every screen (the gallery's grid), or table rows on desktop. */
	public readonly layout = input<RowLayout>('row');
	/** Each column's cell, with its inputs for this row. */
	public readonly cells = input.required<readonly RowCell[]>();
	/** The editor's URL, for the name's link (and opening it in a new tab). */
	public readonly href = input.required<string>();
	public readonly isSelected = input.required<boolean>();
	/** It can be dragged into order. */
	public readonly isDraggable = input(false);
	public readonly menu = input.required<readonly RowMenuItem[]>();

	public readonly opened = output<void>();
	public readonly selectionToggled = output<void>();

	/** Opens in the modal, unless asked for a new tab or window. */
	protected openFromLink(event: MouseEvent): void {
		if (event.ctrlKey || event.metaKey || event.shiftKey || event.button) {
			return;
		}
		event.preventDefault();
		this.opened.emit();
	}

	/** Opens the row unless the click was on one of its own controls. */
	protected openFromRow(event: Event): void {
		const target = event.target as HTMLElement;
		if (!target.closest('a, button, input, label, mat-checkbox')) {
			this.opened.emit();
		}
	}
}

/** A column's cell in a row: its component and inputs. */
export interface RowCell {
	column: ListColumn;
	inputs: Record<string, unknown>;
}
