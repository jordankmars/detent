"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useRef } from "react";
import { SECTIONS } from "@/lib/docs";
import { external, GITHUB_URL } from "@/lib/links";
import { ghostButton } from "./ghost-button";
import { CloseIcon, MenuIcon } from "./icons";

const label = "px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400";
const link = "block rounded-md px-2 py-2 text-[15px] font-medium";
const active = "bg-neutral-100 dark:bg-neutral-800";

/** The site's navigation below `md`. */
export function MobileMenu() {
	const pathname = usePathname();
	const dialog = useRef<HTMLDialogElement>(null);
	const close = () => dialog.current?.close();

	// The panel fills the dialog, so only the backdrop lands on the dialog itself.
	const onBackdrop = (event: MouseEvent) => {
		if (event.target === event.currentTarget) close();
	};

	return (
		<div className="-ml-2 md:hidden">
			<button
				type="button"
				aria-label="Open menu"
				onClick={() => dialog.current?.showModal()}
				className={ghostButton}
			>
				<MenuIcon className="size-5" />
			</button>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc already closes a modal dialog */}
			<dialog
				ref={dialog}
				aria-label="Menu"
				onClick={onBackdrop}
				className="fixed top-2 left-2 m-0 max-h-[calc(100dvh-24px)] w-[calc(100vw-16px)] max-w-none overflow-y-auto rounded-2xl border border-neutral-200 bg-white text-inherit backdrop:bg-black/30 dark:border-neutral-800 dark:bg-neutral-950"
			>
				<div className="p-2">
					<div className="flex items-center justify-between">
						<h2 className="px-2 text-lg font-semibold tracking-tight">Menu</h2>
						<button
							type="button"
							aria-label="Close menu"
							onClick={close}
							className={ghostButton}
						>
							<CloseIcon className="size-4" />
						</button>
					</div>
					<div className="mt-2 grid gap-5 pb-2">
						<ul>
							<li>
								<Link
									href="/"
									onClick={close}
									aria-current={pathname === "/" ? "page" : undefined}
									className={`${link} ${pathname === "/" ? active : ""}`}
								>
									Home
								</Link>
							</li>
							<li>
								<a
									href={GITHUB_URL}
									{...external}
									onClick={close}
									className={link}
								>
									GitHub
								</a>
							</li>
						</ul>
						{SECTIONS.map((section) => (
							<div key={section.title}>
								<p className={label}>{section.title}</p>
								<ul className="mt-1">
									{section.pages.map((doc) => (
										<li key={doc.href}>
											<Link
												href={doc.href}
												onClick={close}
												aria-current={
													pathname === doc.href ? "page" : undefined
												}
												className={`${link} ${
													pathname === doc.href ? active : ""
												}`}
											>
												{doc.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</dialog>
		</div>
	);
}
