"use client";

import { Detent } from "detent/react";
import { useState } from "react";

const numbers = Array.from({ length: 10_000 }, (_, i) =>
	String(i).padStart(4, "0"),
);

export function LargeList() {
	const [value, setValue] = useState(["1234"]);

	const jump = () => {
		setValue([numbers[Math.floor(Math.random() * numbers.length)]]);
	};

	return (
		<>
			<Detent.Root
				aria-label="Number"
				value={value}
				onValueChange={setValue}
				className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
			>
				<Detent.Wheel
					className="w-24 [--detent-wheel-flex:none]"
					items={numbers}
					loop
					aria-label="Number"
				/>
			</Detent.Root>
			<button
				type="button"
				onClick={jump}
				className="absolute right-3 bottom-3 h-8 rounded-md bg-neutral-100 px-3 text-[13px] font-medium transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
			>
				Jump to random
			</button>
		</>
	);
}
