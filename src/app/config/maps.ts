import { MapDimension } from '../interfaces/api-responses';

/**
 * BlueMap's camera position for a new dimension: above the world's origin,
 * as the season 5 maps open.
 */
export const DEFAULT_MAP_PERSPECTIVE = ':0:0:0:1500:0:0:0:0:';

/**
 * The dimensions a new map season starts with: BlueMap's default maps (its map
 * IDs). Their images still need adding.
 */
export const DEFAULT_MAP_DIMENSIONS: readonly MapDimension[] = [
	{
		name: 'Overworld',
		worldId: 'world',
		imageUrl: '',
		perspective: DEFAULT_MAP_PERSPECTIVE
	},
	{
		name: 'Nether',
		worldId: 'world_nether',
		imageUrl: '',
		perspective: DEFAULT_MAP_PERSPECTIVE
	},
	{
		name: 'End',
		worldId: 'world_the_end',
		imageUrl: '',
		perspective: DEFAULT_MAP_PERSPECTIVE
	}
];
