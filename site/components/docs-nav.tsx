"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/docs";

export function DocsNav() {
	const pathname = usePathname();
	return (
		<nav aria-label="Docs" className="grid gap-6">
			{SECTIONS.map((section) => (
				<div key={section.title}>
					<p className="mb-1 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
						{section.title}
					</p>
					<ul className="grid gap-0.5">
						{section.pages.map((doc) => {
							const active = pathname === doc.href;
							return (
								<li key={doc.href}>
									<Link
										href={doc.href}
										aria-current={active ? "page" : undefined}
										className={`block rounded-md px-2 py-1 text-[13px] font-medium transition-colors ${
											active
												? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
												: "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
										}`}
									>
										{doc.title}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}
