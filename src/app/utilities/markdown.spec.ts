import { renderInlineMarkdown, renderMarkdown, toPlainText } from './markdown';

describe('markdown', () => {
	describe('renderMarkdown', () => {
		it('renders markdown as HTML', () => {
			expect(renderMarkdown('**Season 6** is [here](/news).')).toBe(
				'<p><strong>Season 6</strong> is <a href="/news">here</a>.</p>\n'
			);
		});

		it('shows raw HTML as text', () => {
			const html = renderMarkdown(
				'<script>alert(1)</script>\n\nHi <b>x</b>'
			);
			expect(html).not.toContain('<script');
			expect(html).not.toContain('<b>');
			expect(html).toContain('&lt;script&gt;');
		});

		it('renders images only from the allowlist', () => {
			expect(
				renderMarkdown('![Spawn](https://i.ibb.co/a/spawn.png)')
			).toBe(
				'<p><img src="https://i.ibb.co/a/spawn.png" alt="Spawn" loading="lazy"></p>\n'
			);
			expect(renderMarkdown('![x](https://evil.example/x.png)')).toBe(
				'<p></p>\n'
			);
			// Reference-style images too.
			expect(
				renderMarkdown('![x][img]\n\n[img]: https://evil.example/x.png')
			).not.toContain('<img');
		});

		it('renders an unsafe link as its text', () => {
			for (const href of [
				'javascript:alert(1)',
				'javascript&#58;alert(1)',
				'//evil.example',
				'data:text/html,x'
			]) {
				expect(renderMarkdown(`[click](${href})`)).toBe(
					'<p>click</p>\n'
				);
			}
			expect(renderMarkdown('[mail](mailto:a@b.c)')).toContain(
				'href="mailto:a@b.c"'
			);
		});
	});

	describe('renderInlineMarkdown', () => {
		it('renders inline formatting without a paragraph', () => {
			expect(renderInlineMarkdown('Season *6* `live`')).toBe(
				'Season <em>6</em> <code>live</code>'
			);
		});
	});

	describe('toPlainText', () => {
		it('strips inline markdown', () => {
			expect(toPlainText('**Season** _6_ is [here](/news) `now`')).toBe(
				'Season 6 is here now'
			);
		});

		it('keeps escaped characters as written', () => {
			expect(toPlainText('1 \\* 2 & <3')).toBe('1 * 2 & <3');
		});
	});
});
