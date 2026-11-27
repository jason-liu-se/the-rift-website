/** From this share of a limit, a field shows its character count. */
const COUNT_FROM = 0.8;

/** Whether `value` is close enough to `max` characters to show the count. */
export function isNearLimit(value: string | undefined, max: number): boolean {
	return (value?.length ?? 0) >= max * COUNT_FROM;
}
