import { codeToHtml } from "shiki";

/** Highlights at build time. Colors are inline and follow `color-scheme`. */
export function highlight(code: string, lang = "tsx"): Promise<string> {
	return codeToHtml(code.trimEnd(), {
		lang,
		themes: { light: "github-light", dark: "github-dark" },
		defaultColor: "light-dark()",
	});
}
