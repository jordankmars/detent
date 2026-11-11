"use client";

import { useState } from "react";
import { CodePanel } from "./code-panel";

export function InstallTabs({
	commands,
}: {
	commands: { manager: string; code: string; html: string }[];
}) {
	const [current, setCurrent] = useState(commands[0]);
	return (
		<div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
			<div className="flex h-11 items-center gap-1 border-b border-neutral-200 px-2 dark:border-neutral-800">
				{commands.map((command) => (
					<button
						key={command.manager}
						type="button"
						aria-pressed={command.manager === current.manager}
						onClick={() => setCurrent(command)}
						className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
							command.manager === current.manager
								? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
								: "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
						}`}
					>
						{command.manager}
					</button>
				))}
			</div>
			<CodePanel html={current.html} code={current.code} />
		</div>
	);
}
