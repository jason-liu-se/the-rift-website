import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[appPageOutlet]' })
export class PageOutlet {
	viewContainerRef = inject(ViewContainerRef);
}
