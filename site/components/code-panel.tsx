import { CopyButton } from "./copy-button";

/**
 * Already highlighted code. The copy button sits 12px down, which centers it
 * on a single line: the block is 56px tall and the button 32px.
 */
export function CodePanel({
	html,
	code,
	copy = true,
}: {
	html: string;
	code: string;
	copy?: boolean;
}) {
	return (
		<div className="relative">
			{copy ? (
				<div className="absolute top-3 right-2">
					<CopyButton text={code} />
				</div>
			) : null}
			<div
				className="overflow-x-auto p-4 pr-12 font-mono text-[13px] leading-6 [tab-size:2] [&_pre]:bg-transparent!"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki's output for our own source, made at build time
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}
