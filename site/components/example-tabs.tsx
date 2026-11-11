"use client";

import {
	type KeyboardEvent,
	type ReactNode,
	useId,
	useRef,
	useState,
} from "react";
import { CodePanel } from "./code-panel";

const TABS = ["View", "Code"] as const;
type Tab = (typeof TABS)[number];

/** A live demo and its source. */
export function ExampleTabs({
	view,
	html,
	code,
}: {
	view: ReactNode;
	html: string;
	code: string;
}) {
	const [tab, setTab] = useState<Tab>("View");
	const id = useId();
	const buttons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
		e.preventDefault();
		const next = tab === "View" ? "Code" : "View";
		setTab(next);
		buttons.current[next]?.focus();
	};

	return (
		<div className="my-6">
			<div
				role="tablist"
				aria-label="Example"
				className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800"
			>
				{TABS.map((name) => (
					<button
						key={name}
						ref={(el) => {
							buttons.current[name] = el;
						}}
						type="button"
						role="tab"
						id={`${id}-${name}`}
						aria-selected={tab === name}
						aria-controls={`${id}-panel`}
						tabIndex={tab === name ? 0 : -1}
						onClick={() => setTab(name)}
						onKeyDown={onKeyDown}
						className={`-mb-px border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors ${
							tab === name
								? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
								: "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
						}`}
					>
						{name}
					</button>
				))}
			</div>
			<div
				role="tabpanel"
				id={`${id}-panel`}
				aria-labelledby={`${id}-${tab}`}
				className={`mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 ${
					tab === "Code"
						? "max-h-[28rem] overflow-y-auto bg-neutral-50 dark:bg-neutral-900"
						: ""
				}`}
			>
				{tab === "View" ? (
					<div className="relative grid min-h-80 place-items-center p-8">
						{view}
					</div>
				) : (
					<CodePanel html={html} code={code} />
				)}
			</div>
		</div>
	);
}
