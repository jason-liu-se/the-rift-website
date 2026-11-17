// Runs inside BlueMap's web app, not this site: see "BlueMap" in README.md.
//
// When BlueMap is embedded in the site's map viewer, sends the page embedding
// it BlueMap's URL fragment (map id, camera position, view) whenever it
// changes, so the viewer's URL can follow it. The viewer
// (src/app/pages/blue-map-page/) only accepts messages from BlueMap's origin.
(() => {
	// Opened directly, not embedded: nothing to sync.
	if (window.parent === window) {
		return;
	}

	// Must match BLUEMAP_HASH_MESSAGE in blue-map-page.component.ts.
	const MESSAGE_TYPE = "bluemap:hash";

	const postHash = () =>
		window.parent.postMessage(
			{ type: MESSAGE_TYPE, hash: location.hash.slice(1) },
			// The map view is public, so any embedding page may read it.
			"*"
		);

	// BlueMap updates its address with history.replaceState, which doesn't fire
	// 'hashchange', so wrap the history methods too.
	for (const method of ["pushState", "replaceState"]) {
		const original = history[method];
		history[method] = function (...args) {
			const result = original.apply(this, args);
			postHash();
			return result;
		};
	}
	addEventListener("hashchange", postHash);
	// BlueMap loads this script after setting its starting view (including
	// swapping an unknown map id for its default map), so report that view too.
	postHash();
})();
