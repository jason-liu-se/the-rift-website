import { Lexer, Marked, Token, Tokens } from 'marked';
import { isAllowedImageUrl } from './image-urls';

// News titles (inline) and content are markdown, rendered with the same
// `marked` version the API checks them with (pinned in package.json). The API
// refuses raw HTML, unsafe links, and images from outside the allowlist, so
// these rules only matter for content saved before it checked: raw HTML shows
// as text, an unsafe link as its text, and other images not at all. Angular
// sanitises the result again when it's bound with [innerHTML].

/**
 * A web, email, or relative address; the same rule as the API's. A relative
 * one can't contain `:` or `&` (so no `javascript:`, or its entity-encoded
 * form) or start with two slashes (another host).
 */
const SAFE_LINK = /^(https?:\/\/|mailto:)|^(?![/\\]{2})[^:&]*$/i;

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

const marked = new Marked({
	async: false,
	renderer: {
		html: ({ text }: Tokens.HTML | Tokens.Tag) => escapeHtml(text),
		image: ({ href, text, title }: Tokens.Image) =>
			isAllowedImageUrl(href)
				? `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${
						title ? ` title="${escapeHtml(title)}"` : ''
					} loading="lazy">`
				: '',
		link(token: Tokens.Link) {
			// `false` falls back to marked's own link rendering.
			return SAFE_LINK.test(token.href)
				? false
				: this.parser.parseInline(token.tokens);
		}
	}
});

/** News content as HTML. */
export function renderMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false });
}

/** A news title as HTML: inline formatting only (no paragraphs or headings). */
export function renderInlineMarkdown(markdown: string): string {
	return marked.parseInline(markdown, { async: false });
}

/**
 * Inline markdown as plain text, for where HTML can't go: the page `<title>`,
 * meta tags, and accessible names. `**Season** 6` → `Season 6`.
 */
export function toPlainText(markdown: string): string {
	return tokensToText(Lexer.lexInline(markdown));
}

function tokensToText(tokens: Token[]): string {
	return tokens
		.map((token) => {
			if (token.type === 'image') {
				return token.text;
			}
			if ('tokens' in token && token.tokens) {
				return tokensToText(token.tokens);
			}
			return 'text' in token ? token.text : '';
		})
		.join('');
}
