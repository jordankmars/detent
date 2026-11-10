"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS } from "@/lib/docs";

export function DocsNav() {
	const pathname = usePathname();
	return (
		<nav aria-label="Docs">
			<p className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
				Getting started
			</p>
			<ul className="grid gap-0.5">
				{DOCS.map((doc) => {
					const active = pathname === doc.href;
					return (
						<li key={doc.href}>
							<Link
								href={doc.href}
								aria-current={active ? "page" : undefined}
								className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
									active
										? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
										: "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
								}`}
							>
								{doc.title}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
