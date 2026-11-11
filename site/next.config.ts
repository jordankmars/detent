import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	images: { unoptimized: true },
	pageExtensions: ["ts", "tsx", "md", "mdx"],
	turbopack: {
		rules: {
			"*.css": {
				loaders: ["@tailwindcss/turbopack"],
				as: "*.css",
			},
		},
	},
};

export default createMDX({
	options: {
		remarkPlugins: ["remark-gfm"],
		rehypePlugins: ["rehype-slug"],
	},
})(nextConfig);
