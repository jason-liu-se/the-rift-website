import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[appPageTemplateHost]' })
export class PageTemplateDirective {
	viewContainerRef = inject(ViewContainerRef);
}
