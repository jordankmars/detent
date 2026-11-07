import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		"react/index": "src/react/index.ts",
	},
	format: "esm",
	dts: true,
	clean: true,
	publint: true,
	attw: { profile: "esm-only", level: "error" },
});
