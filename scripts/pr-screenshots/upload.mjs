// Uploads screenshots for a pull request and prints Markdown to paste into its
// description. GitHub has no API for attaching images, so they're committed
// to the `pr-screenshots` branch (never merged; safe to prune) under a folder
// named after the current branch, and linked by that commit, so later uploads
// don't change them. Uses git plumbing: the working tree and index are never
// touched, so it's safe in worktrees.
//
// Usage: node scripts/pr-screenshots/upload.mjs <image>...
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const BRANCH = "pr-screenshots";
const PUSH_ATTEMPTS = 3;

const files = process.argv.slice(2);
if (files.length === 0 || files.some((file) => !existsSync(file))) {
	console.error("Usage: node scripts/pr-screenshots/upload.mjs <image>...");
	process.exit(1);
}

const git = (args, env = {}) =>
	execFileSync("git", args, {
		encoding: "utf8",
		env: { ...process.env, ...env },
		stdio: ["ignore", "pipe", "pipe"]
	}).trim();

const repo = execFileSync(
	"gh",
	["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
	{ encoding: "utf8" }
).trim();
const folder = git(["branch", "--show-current"]).replace(/[^\w.-]+/g, "-");

const commit = pushCommit();
for (const file of files) {
	const name = basename(file);
	console.log(
		`![${name}](https://raw.githubusercontent.com/${repo}/${commit}/${folder}/${name})`
	);
}

/** Commits the files onto the latest remote branch, retrying if another upload wins the race. */
function pushCommit() {
	for (let attempt = 1; ; attempt++) {
		const parent = fetchBranchTip();
		const commit = commitFiles(parent);
		try {
			git(["push", "-q", "origin", `${commit}:refs/heads/${BRANCH}`]);
			return commit;
		} catch (error) {
			if (attempt === PUSH_ATTEMPTS) {
				throw error;
			}
		}
	}
}

/** The remote branch's latest commit, or null before the first upload. */
function fetchBranchTip() {
	try {
		git(["fetch", "-q", "origin", BRANCH]);
		return git(["rev-parse", "FETCH_HEAD"]);
	} catch {
		return null;
	}
}

function commitFiles(parent) {
	const scratch = mkdtempSync(join(tmpdir(), "pr-screenshots-"));
	const env = { GIT_INDEX_FILE: join(scratch, "index") };
	try {
		if (parent) {
			git(["read-tree", parent], env);
		}
		for (const file of files) {
			const blob = git(["hash-object", "-w", file]);
			git(
				[
					"update-index",
					"--add",
					"--cacheinfo",
					`100644,${blob},${folder}/${basename(file)}`
				],
				env
			);
		}
		const tree = git(["write-tree"], env);
		const parentArgs = parent ? ["-p", parent] : [];
		return git([
			"commit-tree",
			tree,
			...parentArgs,
			"-m",
			`Screenshots for ${folder}`
		]);
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}
