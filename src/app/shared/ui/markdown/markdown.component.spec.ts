import { TestBed } from '@angular/core/testing';
import { MarkdownComponent } from './markdown.component';

describe('MarkdownComponent', () => {
	function render(markdown: string, inline = false): HTMLElement {
		TestBed.configureTestingModule({ imports: [MarkdownComponent] });
		const fixture = TestBed.createComponent(MarkdownComponent);
		fixture.componentRef.setInput('markdown', markdown);
		fixture.componentRef.setInput('inline', inline);
		fixture.detectChanges();
		return fixture.nativeElement;
	}

	it('renders block markdown', () => {
		const element = render('# Hi\n\nA **bold** move.');

		expect(element.querySelector('h1')?.textContent).toBe('Hi');
		expect(element.querySelector('p strong')?.textContent).toBe('bold');
	});

	it('renders inline markdown without block elements', () => {
		const element = render('# *Hi*', true);

		expect(element.innerHTML).toBe('# <em>Hi</em>');
	});

	it('never renders raw HTML or unsafe links', () => {
		const element = render(
			'<img src=x onerror=alert(1)> [x](javascript:alert(1))'
		);

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('a')).toBeNull();
	});
});
