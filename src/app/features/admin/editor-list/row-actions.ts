import { EditorListActions } from './editor-list-actions';
import { ItemRow, ListRow } from './list-rows';

/** A table's row, or a card: a phone's, or the gallery grid's. */
export type RowLayout = 'row' | 'card';

/** One entry of a row's menu, ready to show. */
export interface RowMenuItem {
	label: string;
	icon: string;
	isDanger?: boolean;
	/** A divider goes above it. */
	startsGroup?: boolean;
	/** A link (opens in a new tab), or else `run`. */
	href?: string;
	run?: () => void;
}

/** What a row's actions need beyond the row. */
export interface RowActionContext {
	layout: RowLayout;
	/** Its place among the items, while the list can be put in order. */
	index?: number;
	itemCount: number;
	/** Where it shows on the site, when it's live. */
	publicPath?: string;
	actions: EditorListActions;
}

type RowText = string | ((row: ItemRow) => string);

interface RowAction {
	label: RowText;
	icon: RowText;
	isDanger?: boolean;
	startsGroup?: boolean;
	appliesTo: (row: ListRow, context: RowActionContext) => boolean;
	href?: (context: RowActionContext) => string | undefined;
	run?: (row: ListRow, context: RowActionContext) => void;
}

const isItem = (row: ListRow): row is ItemRow => row.kind === 'item';

/** The menu's actions, in order. */
const ROW_ACTIONS: readonly RowAction[] = [
	{
		label: 'Copy image link',
		icon: 'link',
		appliesTo: (row, { layout }) => layout === 'card' && !!imageUrlOf(row),
		run: (row, { actions }) => actions.copyImageUrl(imageUrlOf(row)!)
	},
	{
		label: 'Duplicate',
		icon: 'content_copy',
		appliesTo: isItem,
		run: (row, { actions }) => actions.duplicate((row as ItemRow).item)
	},
	{
		label: ({ item }) => (item.visible ? 'Hide from site' : 'Show on site'),
		icon: ({ item }) => (item.visible ? 'visibility_off' : 'visibility'),
		appliesTo: isItem,
		run: (row, { actions }) => actions.toggleVisibility(row as ItemRow)
	},
	{
		label: 'Move up',
		icon: 'arrow_upward',
		appliesTo: (_, { index }) => index !== undefined && index > 0,
		run: (_, { actions, index }) => actions.moveItem(index!, index! - 1)
	},
	{
		label: 'Move down',
		icon: 'arrow_downward',
		appliesTo: (_, { index, itemCount }) =>
			index !== undefined && index < itemCount - 1,
		run: (_, { actions, index }) => actions.moveItem(index!, index! + 1)
	},
	{
		label: 'View on site',
		icon: 'open_in_new',
		appliesTo: (_, { publicPath }) => !!publicPath,
		href: ({ publicPath }) => publicPath
	},
	{
		label: 'Delete',
		icon: 'delete',
		isDanger: true,
		startsGroup: true,
		appliesTo: () => true,
		run: (row, { actions }) => actions.delete(row)
	}
];

/** The row's menu: the actions that apply to it. */
export function toRowMenu(
	row: ListRow,
	context: RowActionContext
): RowMenuItem[] {
	return ROW_ACTIONS.filter((action) => action.appliesTo(row, context)).map(
		({ label, icon, isDanger, startsGroup, href, run }, index) => ({
			label: typeof label === 'string' ? label : label(row as ItemRow),
			icon: typeof icon === 'string' ? icon : icon(row as ItemRow),
			isDanger,
			startsGroup: startsGroup && index > 0,
			href: href?.(context),
			run: run && (() => run(row, context))
		})
	);
}

function imageUrlOf({ data: { fields } }: ListRow): string | undefined {
	return ('imageUrl' in fields && fields.imageUrl) || undefined;
}
