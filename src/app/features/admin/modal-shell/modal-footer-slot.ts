import {
	DestroyRef,
	Directive,
	Injectable,
	TemplateRef,
	inject,
	signal
} from '@angular/core';

/**
 * Lets content nested inside a modal put its actions in the modal's footer:
 * the modal provides this and renders `template()` in its footer; the content
 * marks its actions `<ng-template appModalFooter>`.
 */
@Injectable()
export class ModalFooterSlot {
	public readonly template = signal<TemplateRef<unknown> | undefined>(
		undefined
	);
}

@Directive({ selector: 'ng-template[appModalFooter]' })
export class ModalFooter {
	constructor() {
		const slot = inject(ModalFooterSlot);
		slot.template.set(inject(TemplateRef));
		inject(DestroyRef).onDestroy(() => slot.template.set(undefined));
	}
}
