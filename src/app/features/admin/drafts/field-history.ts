import { computed, signal } from '@angular/core';
import { UNDO_GROUP_MS } from 'src/app/core/config/admin';

/**
 * Undo and redo for a set of fields. Changes to the same fields in quick
 * succession (typing) are one step.
 */
export class FieldHistory<F> {
	private undoStack: F[] = [];
	private redoStack: F[] = [];
	private lastChange = { keys: '', at: 0 };
	private readonly size = signal({ undo: 0, redo: 0 });

	public readonly canUndo = computed(() => this.size().undo > 0);
	public readonly canRedo = computed(() => this.size().redo > 0);

	/** Notes the fields as they were before a change to `changedKeys`. */
	public record(before: F, changedKeys: readonly string[]): void {
		const keys = [...changedKeys].sort().join();
		const now = Date.now();
		const isSameStep =
			keys === this.lastChange.keys &&
			now - this.lastChange.at < UNDO_GROUP_MS;
		if (!isSameStep) {
			this.undoStack.push(before);
			this.redoStack = [];
		}
		this.lastChange = { keys, at: now };
		this.updateSize();
	}

	/** The fields before the last step, or undefined if there's none. */
	public undo(current: F): F | undefined {
		return this.step(this.undoStack, this.redoStack, current);
	}

	/** The fields after the last undone step, or undefined if there's none. */
	public redo(current: F): F | undefined {
		return this.step(this.redoStack, this.undoStack, current);
	}

	private step(from: F[], to: F[], current: F): F | undefined {
		const fields = from.pop();
		if (fields) {
			to.push(current);
			this.lastChange = { keys: '', at: 0 };
			this.updateSize();
		}
		return fields;
	}

	private updateSize(): void {
		this.size.set({
			undo: this.undoStack.length,
			redo: this.redoStack.length
		});
	}
}
