"use client";

import { useTheme } from "next-themes";
import { ghostButton } from "./ghost-button";
import { MoonIcon, SunIcon } from "./icons";

// Both icons render, and CSS picks one, so the server markup never has to
// guess the theme.
export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	return (
		<button
			type="button"
			className={ghostButton}
			aria-label="Toggle theme"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
		>
			<MoonIcon className="size-4 dark:hidden" />
			<SunIcon className="hidden size-4 dark:block" />
		</button>
	);
}
