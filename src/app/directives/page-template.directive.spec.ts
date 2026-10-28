import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PageTemplateDirective } from './page-template.directive';

@Component({
  template: '<ng-template appPageTemplateHost></ng-template>',
  standalone: false
})
class TestHostComponent {
  @ViewChild(PageTemplateDirective, { static: true })
  directive!: PageTemplateDirective;
}

describe('PageTemplateDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent, PageTemplateDirective]
    });
    const fixture = TestBed.createComponent(TestHostComponent);
    const directive = fixture.componentInstance.directive;
    expect(directive).toBeTruthy();
    expect(directive.viewContainerRef).toBeTruthy();
  });
});
