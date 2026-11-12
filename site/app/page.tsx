import Link from "next/link";
import { HeroTimePicker } from "@/components/hero-time-picker";
import { BookIcon, GitHubIcon } from "@/components/icons";
import { AUTHOR_URL, external, GITHUB_URL } from "@/lib/links";

const button =
	"flex h-10 items-center gap-2 rounded-xl px-4 text-[14px]/[1.5] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";

export default function Home() {
	return (
		<main className="flex flex-1 justify-center px-4 pt-24 pb-16 sm:pt-40">
			<div className="flex flex-col items-center text-center">
				{/*
				 * The chip is absolutely positioned, so only the word is centered.
				 * It's sized in the hero's ems: with a line height of 1, Inter's
				 * baseline sits 0.137em above the bottom of the line.
				 */}
				<div className="relative text-6xl leading-none sm:text-7xl">
					<h1 className="font-semibold tracking-tight">Tambour</h1>
					<span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 sm:top-auto sm:bottom-[0.137em] sm:left-full sm:mt-0 sm:ml-3 sm:translate-x-0">
						<a
							href={AUTHOR_URL}
							{...external}
							className="block rounded-full text-xs border border-neutral-200 px-2.5 py-0.5 leading-4 whitespace-nowrap text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-100"
						>
							by jordan mars
						</a>
					</span>
				</div>
				<p className="mt-12 max-w-md text-lg text-balance text-neutral-500 sm:mt-4 dark:text-neutral-400">
					iOS scroll-wheel picker for the web.
				</p>
				<div className="mt-8 flex gap-3">
					<Link
						href="/docs"
						className={`${button} bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200`}
					>
						<BookIcon className="size-[15px]" />
						Documentation
					</Link>
					<a
						href={GITHUB_URL}
						{...external}
						className={`${button} border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900`}
					>
						<GitHubIcon className="size-[15px]" />
						GitHub
					</a>
				</div>
				<div className="mt-12">
					<HeroTimePicker />
				</div>
			</div>
		</main>
	);
}
