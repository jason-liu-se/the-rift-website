import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[appPageTemplateHost]',
    standalone: false
})
export class PageTemplateDirective {
    constructor(public viewContainerRef: ViewContainerRef) {}
}
