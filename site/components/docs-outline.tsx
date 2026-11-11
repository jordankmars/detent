"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Heading {
	id: string;
	text: string;
	depth: number;
}

/** Headings count as reached once they pass just below the sticky header. */
const REACHED = 96;

/** The current page's headings. Read from the DOM, as MDX doesn't expose them. */
export function DocsOutline() {
	const pathname = usePathname();
	const [headings, setHeadings] = useState<Heading[]>([]);
	const [current, setCurrent] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: a new page means new headings
	useEffect(() => {
		const found = Array.from(
			document.querySelectorAll("article :is(h2, h3)[id]"),
		);
		setHeadings(
			found.map((el) => ({
				id: el.id,
				// Every heading ends in its own "#" anchor link.
				text: (el.textContent ?? "").replace(/#$/, ""),
				depth: el.tagName === "H3" ? 1 : 0,
			})),
		);
		const onScroll = () => {
			const passed = found.filter(
				(el) => el.getBoundingClientRect().top <= REACHED,
			);
			setCurrent(passed.at(-1)?.id ?? found[0]?.id ?? "");
		};
		onScroll();
		addEventListener("scroll", onScroll, { passive: true });
		return () => removeEventListener("scroll", onScroll);
	}, [pathname]);

	if (!headings.length) return null;
	return (
		<nav aria-label="On this page">
			<p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
				On This Page
			</p>
			<ul className="grid gap-2 text-[13px]">
				{headings.map((heading) => (
					<li key={heading.id} className={heading.depth ? "pl-3" : undefined}>
						<a
							href={`#${heading.id}`}
							aria-current={heading.id === current ? "location" : undefined}
							className={`transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
								heading.id === current
									? "text-neutral-900 dark:text-neutral-100"
									: "text-neutral-500 dark:text-neutral-400"
							}`}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
