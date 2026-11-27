import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PageOutlet } from './page-outlet';

@Component({
	template: '<ng-template appPageOutlet></ng-template>',
	imports: [PageOutlet]
})
class TestHost {
	@ViewChild(PageOutlet, { static: true })
	directive!: PageOutlet;
}

describe('PageOutlet', () => {
	it('should create an instance', () => {
		TestBed.configureTestingModule({
			imports: [TestHost]
		});
		const fixture = TestBed.createComponent(TestHost);
		const directive = fixture.componentInstance.directive;
		expect(directive).toBeTruthy();
		expect(directive.viewContainerRef).toBeTruthy();
	});
});
