/** A BlueMap view's position: 8 numbers, between colons. */
const POSITION_PARTS = 8;

/**
 * The map ID and starting view in a BlueMap link
 * (`…/#<mapId>:<x>:<y>:<z>:<distance>:<rotation>:<angle>:<tilt>:<ortho>:<mode>`),
 * as a dimension stores them; undefined for anything else.
 */
export function parseBlueMapLink(
	text: string
): { worldId: string; perspective: string } | undefined {
	const hash = text.trim().split('#')[1];
	const [worldId, ...rest] = hash?.split(':') ?? [];
	const position = rest.slice(0, POSITION_PARTS);
	const isPosition =
		position.length === POSITION_PARTS &&
		position.every((part) => part !== '' && !Number.isNaN(Number(part)));
	return worldId && isPosition
		? { worldId, perspective: `:${position.join(':')}:` }
		: undefined;
}
