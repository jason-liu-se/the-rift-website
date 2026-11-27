import { EDITOR_GALLERY_IMAGES } from 'src/app/testing/api-fixtures';
import { EditorListActions } from './editor-list-actions';
import { toItemRow } from './list-rows';
import { RowActionContext, toRowMenu } from './row-actions';

describe('toRowMenu', () => {
	const image = { ...EDITOR_GALLERY_IMAGES[0], visible: true };
	const context = (changes: Partial<RowActionContext> = {}) => ({
		layout: 'row' as const,
		itemCount: 3,
		actions: {} as EditorListActions,
		...changes
	});
	const labels = (changes?: Partial<RowActionContext>) =>
		toRowMenu(toItemRow(image, false), context(changes)).map(
			({ label }) => label
		);

	it.each([
		[{}, ['Duplicate', 'Hide from site', 'Delete']],
		[
			{ layout: 'card' as const, publicPath: '/gallery/x' },
			[
				'Copy image link',
				'Duplicate',
				'Hide from site',
				'View on site',
				'Delete'
			]
		],
		[{ index: 0 }, ['Duplicate', 'Hide from site', 'Move down', 'Delete']],
		[{ index: 2 }, ['Duplicate', 'Hide from site', 'Move up', 'Delete']]
	])('offers the actions that apply (%o)', (changes, expected) => {
		expect(labels(changes)).toEqual(expected);
	});

	it('runs an action on its row', () => {
		const moveItem = vi.fn();
		const menu = toRowMenu(
			toItemRow(image, false),
			context({
				index: 1,
				actions: { moveItem } as unknown as EditorListActions
			})
		);
		menu.find(({ label }) => label === 'Move up')!.run!();
		expect(moveItem).toHaveBeenCalledWith(1, 0);
	});
});
