import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		"react/index": "src/react/index.ts",
	},
	format: "esm",
	// Bundling would lift "use client" off the components, or lose it.
	unbundle: true,
	inputOptions: {
		onLog(level, log, defaultHandler) {
			// Unbundled output does keep them, which is why it's unbundled.
			if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
			defaultHandler(level, log);
		},
	},
	dts: true,
	clean: true,
	publint: true,
	attw: { profile: "esm-only", level: "error" },
});
