import Link from "next/link";
import { external, GITHUB_URL } from "@/lib/links";
import { ghostButton } from "./ghost-button";
import { GitHubIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
	return (
		<header>
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Link href="/" className="text-lg font-semibold tracking-tight">
					Detent
				</Link>
				<nav className="flex items-center gap-1">
					<Link
						href="/docs"
						className="relative mr-2 text-sm after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
					>
						Docs
					</Link>
					<a
						href={GITHUB_URL}
						{...external}
						className={ghostButton}
						aria-label="GitHub"
					>
						<GitHubIcon className="size-4" />
					</a>
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
}
