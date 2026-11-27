import { parseBlueMapLink } from './bluemap-link';

describe('parseBlueMapLink', () => {
	it('reads the map ID and starting view from a BlueMap link', () => {
		expect(
			parseBlueMapLink(
				'https://map.example.com/#s6_overworld:120:64:-80:900:0.5:0:0:0:perspective'
			)
		).toEqual({
			worldId: 's6_overworld',
			perspective: ':120:64:-80:900:0.5:0:0:0:'
		});
	});

	it.each([
		['a plain value', ':0:0:0:1500:0:0:0:0:'],
		['a link without a view', 'https://map.example.com/'],
		['a view with too few numbers', 'https://map.example.com/#world:1:2'],
		['a view with words', 'https://map.example.com/#world:a:b:c:d:e:f:g:h']
	])('ignores %s', (_, text) => {
		expect(parseBlueMapLink(text)).toBeUndefined();
	});
});
