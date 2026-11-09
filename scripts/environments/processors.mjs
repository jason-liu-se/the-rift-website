// Checks for environment variables, assigned to variables in config.mjs.
// Each gets the variable's full name (for error messages) and its value, and
// returns the value to use or throws an Error explaining what's wrong.

/** Returns the URL without trailing slashes, or throws if it isn't http(s). */
export function normaliseUrl(name, value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`${name} is not a valid URL: "${value}".`);
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(`${name} must be an http(s) URL: "${value}".`);
	}
	return value.replace(/\/+$/, "");
}
