"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS } from "@/lib/docs";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

function useNeighbors() {
	const pathname = usePathname();
	const index = DOCS.findIndex((doc) => doc.href === pathname);
	return index === -1
		? {}
		: { previous: DOCS[index - 1], next: DOCS[index + 1] };
}

const button =
	"inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-100 px-3 text-[13px] font-medium transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700";
const icon =
	"inline-grid size-8 place-items-center rounded-md bg-neutral-100 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700";

/** Previous and next at the end of a page. */
export function DocsPager() {
	const { previous, next } = useNeighbors();
	return (
		<nav aria-label="Pages" className="mt-14 flex justify-between">
			{previous ? (
				<Link href={previous.href} className={button}>
					<ChevronLeftIcon className="size-3.5" />
					{previous.title}
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link href={next.href} className={button}>
					{next.title}
					<ChevronRightIcon className="size-3.5" />
				</Link>
			) : null}
		</nav>
	);
}

/** Previous and next as icons, beside a page's title. */
export function DocsPagerIcons() {
	const { previous, next } = useNeighbors();
	return (
		<div className="flex shrink-0 gap-1.5 pt-1.5">
			{previous ? (
				<Link
					href={previous.href}
					aria-label={`Previous: ${previous.title}`}
					className={icon}
				>
					<ChevronLeftIcon className="size-4" />
				</Link>
			) : null}
			{next ? (
				<Link
					href={next.href}
					aria-label={`Next: ${next.title}`}
					className={icon}
				>
					<ChevronRightIcon className="size-4" />
				</Link>
			) : null}
		</div>
	);
}
