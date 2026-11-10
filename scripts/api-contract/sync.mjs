// Copies The Rift API's response contract from the web-server repo, which owns
// it, to src/app/interfaces/api-responses.ts. The copy is committed, so the
// website builds without the server checked out.
//
// Usage: node scripts/api-contract/sync.mjs [--check]
//
// The server's checkout is found through LOCAL_WEB_SERVER_PATH, read from the
// shell or .env (the shell wins), absolute or relative to this repo.
//
// --check fails if the copy differs from the server's file instead of copying.
// It only warns when LOCAL_WEB_SERVER_PATH isn't set (e.g. in CI), since
// there's nothing to compare against.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const ENV_FILE = ".env";
const PATH_VARIABLE = "LOCAL_WEB_SERVER_PATH";
const CONTRACT_IN_SERVER = "src/contract/api-responses.ts";
const COPY = "src/app/interfaces/api-responses.ts";

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

const source = resolve(serverPath, CONTRACT_IN_SERVER);

if (!existsSync(source)) {
	console.error(
		`api-contract: ${source} not found. Check that ${PATH_VARIABLE} points to your web-server checkout.`
	);
	process.exit(1);
}

const contract = readFileSync(source, "utf8");

if (!options.check) {
	writeFileSync(COPY, contract);
	console.log(`api-contract: copied ${source} to ${COPY}`);
} else if (!existsSync(COPY) || readFileSync(COPY, "utf8") !== contract) {
	console.error(
		`api-contract: ${COPY} is out of date with the web-server's contract. Run \`npm run api:sync\`.`
	);
	process.exit(1);
}
