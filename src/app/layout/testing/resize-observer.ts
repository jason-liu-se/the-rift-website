/**
 * jsdom has no ResizeObserver, which the navbar uses to publish
 * its height. Stubs it for the current test (undo with
 * `vi.unstubAllGlobals()`) and returns a function that fires the last
 * observer's callback, as a resize would.
 */
export function stubResizeObserver(): () => void {
	let callback: () => void = () => undefined;
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(onResize: () => void) {
				callback = onResize;
			}
			observe = vi.fn();
			disconnect = vi.fn();
		}
	);
	return () => callback();
}
