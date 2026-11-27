// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierConfig = require("eslint-config-prettier");
const { readdirSync } = require("node:fs");

// Dependency rules between src/app's areas (CLAUDE.md "File scoping"). Each
// pattern matches both `src/app/...` and relative specifiers.
const FEATURES = readdirSync("src/app/features");
const NO_LAYOUT = {
	regex: "(^|/)core/layout(/|$)",
	message: "Only app.routes and app.component import core/layout."
};
const NO_FEATURES = {
	regex: "(^|/)features/",
	message: "core and shared never import features."
};
const restrictImports = (files, ...patterns) => ({
	files,
	rules: { "no-restricted-imports": ["error", { patterns }] }
});
// A file follows the last block that matches it, so core/layout comes after core.
const importBoundaries = [
	restrictImports(
		["src/app/core/**/*.ts"],
		NO_FEATURES,
		// From elsewhere in core, layout is a sibling folder.
		{ ...NO_LAYOUT, regex: "(^|/)core/layout(/|$)|^(\\.\\./)+layout(/|$)" }
	),
	restrictImports(["src/app/core/layout/**/*.ts"], NO_FEATURES),
	restrictImports(["src/app/shared/**/*.ts"], NO_FEATURES, NO_LAYOUT),
	// Admin may also import public features, since it previews and edits them.
	restrictImports(["src/app/features/admin/**/*.ts"], NO_LAYOUT),
	...FEATURES.filter((feature) => feature !== "admin").map((feature) => {
		const others = FEATURES.filter((other) => other !== feature).join("|");
		return restrictImports(
			[`src/app/features/${feature}/**/*.ts`],
			NO_LAYOUT,
			{
				regex: `(^|/)features/(?!${feature}/)|^(\\.\\./)+(${others})(/|$)`,
				message:
					"A public feature imports only core, shared and itself."
			}
		);
	})
];

module.exports = defineConfig([
	{
		ignores: [
			"dist/",
			".angular/",
			"coverage/",
			"test-results/",
			"playwright-report/",
			// verbatim copy of the web-server's contract (npm run api:sync)
			"src/app/core/api/api-*.ts",
			".agents/skills/color-expert/*",
			".agents/skills/stageshow/*"
		]
	},
	{
		files: ["**/*.ts"],
		extends: [
			eslint.configs.recommended,
			tseslint.configs.recommended,
			tseslint.configs.stylistic,
			angular.configs.tsRecommended
		],
		processor: angular.processInlineTemplates,
		rules: {
			"@angular-eslint/directive-selector": [
				"error",
				{
					type: "attribute",
					prefix: "app",
					style: "camelCase"
				}
			],
			"@angular-eslint/component-selector": [
				"error",
				{
					type: "element",
					prefix: "app",
					style: "kebab-case"
				}
			]
		}
	},
	...importBoundaries,
	{
		files: ["**/*.html"],
		extends: [
			angular.configs.templateRecommended,
			angular.configs.templateAccessibility
		],
		rules: {}
	},
	// Must be last: turns off any rules that conflict with Prettier.
	prettierConfig,
	// After prettierConfig, which disables `curly`; "all" doesn't conflict with Prettier.
	{
		files: ["**/*.ts"],
		rules: {
			curly: ["error", "all"]
		}
	}
]);
