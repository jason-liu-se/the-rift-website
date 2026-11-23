// Copies The Rift API's contract from the web-server repo, which owns it: every
// api-*.ts file in its src/contract/ (api-requests.ts, api-responses.ts) to
// src/app/interfaces/. The copies are committed, so the website builds without
// the server checked out.
//
// Usage: node scripts/api-contract/sync.mjs [--check]
//
// The server's checkout is found through LOCAL_WEB_SERVER_PATH, read from the
// shell or .env (the shell wins), absolute or relative to this repo. A relative
// path is resolved from the main checkout, so it also works in git worktrees.
//
// --check fails if a copy differs from the server's file, or is missing,
// instead of copying. It only warns when LOCAL_WEB_SERVER_PATH isn't set (e.g.
// in CI), since there's nothing to compare against.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const ENV_FILE = ".env";
const PATH_VARIABLE = "LOCAL_WEB_SERVER_PATH";
const CONTRACT_IN_SERVER = "src/contract";
const COPIES = "src/app/interfaces";
// Only the contract's own files (api-requests.ts, api-responses.ts), which
// the lint and format ignores also match.
const CONTRACT_PREFIX = "api-";

const { values: options } = parseArgs({
	options: { check: { type: "boolean", default: false } }
});

// Doesn't override variables already set in the shell.
if (existsSync(ENV_FILE)) {
	process.loadEnvFile(ENV_FILE);
}

const serverPath = process.env[PATH_VARIABLE];

if (!serverPath) {
	const message = `api-contract: ${PATH_VARIABLE} is not set`;
	if (options.check) {
		console.warn(`${message}; skipping the check.`);
		process.exit(0);
	}
	console.error(
		`${message}. Set it in .env to your web-server checkout (see README "Environment variables").`
	);
	process.exit(1);
}

const source = resolve(mainCheckout(), serverPath, CONTRACT_IN_SERVER);

if (!existsSync(source)) {
	console.error(
		`api-contract: ${source} not found. Check that ${PATH_VARIABLE} points to your the-rift-web-server clone.`
	);
	process.exit(1);
}

const files = readdirSync(source).filter(
	(file) => file.startsWith(CONTRACT_PREFIX) && file.endsWith(".ts")
);
const stale = files.filter((file) => {
	const copy = join(COPIES, file);
	const contract = readFileSync(join(source, file), "utf8");
	return !existsSync(copy) || readFileSync(copy, "utf8") !== contract;
});

if (!options.check) {
	for (const file of stale) {
		writeFileSync(join(COPIES, file), readFileSync(join(source, file)));
	}
	console.log(
		`api-contract: ${files.join(", ")} from ${source} (${stale.length} changed)`
	);
} else if (stale.length > 0) {
	console.error(
		`api-contract: ${stale.join(", ")} out of date with the web-server's contract. Run \`npm run api:sync\`.`
	);
	process.exit(1);
}

/** The main checkout's root, even from a worktree; this folder outside git. */
function mainCheckout() {
	try {
		const commonDir = execFileSync(
			"git",
			["rev-parse", "--path-format=absolute", "--git-common-dir"],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
		).trim();
		return dirname(commonDir);
	} catch {
		return process.cwd();
	}
}
