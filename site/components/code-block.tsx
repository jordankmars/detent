import { highlight } from "@/lib/highlight";
import { CodePanel } from "./code-panel";
import { CopyButton } from "./copy-button";

export async function CodeBlock({
	code,
	lang,
	filename,
}: {
	code: string;
	lang?: string;
	filename?: string;
}) {
	const source = code.trimEnd();
	return (
		<div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
			{filename ? (
				<div className="flex h-11 items-center justify-between border-b border-neutral-200 pr-2 pl-4 font-mono text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
					{filename}
					<CopyButton text={source} />
				</div>
			) : null}
			<CodePanel
				html={await highlight(code, lang)}
				code={source}
				copy={!filename}
			/>
		</div>
	);
}
