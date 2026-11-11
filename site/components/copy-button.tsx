"use client";

import { useEffect, useRef, useState } from "react";
import { ghostButton } from "./ghost-button";
import { CheckIcon, CopyIcon } from "./icons";

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);

	const copy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopied(false), 1500);
	};

	return (
		<button
			type="button"
			onClick={copy}
			aria-label={copied ? "Copied" : "Copy code"}
			className={`${ghostButton} text-neutral-500 dark:text-neutral-400`}
		>
			{copied ? (
				<CheckIcon className="size-3.5" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
		</button>
	);
}
