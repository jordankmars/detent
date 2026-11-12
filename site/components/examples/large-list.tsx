"use client";

import { useState } from "react";
import { Tambour } from "tambour/react";

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
			<Tambour.Root
				aria-label="Number"
				value={value}
				onValueChange={setValue}
				className="[--tambour-band-background:var(--color-neutral-100)] [--tambour-band-inset:-10px] [--tambour-item-color:var(--color-neutral-400)] dark:[--tambour-band-background:var(--color-neutral-800)] dark:[--tambour-item-color:var(--color-neutral-500)]"
			>
				<Tambour.Wheel
					className="w-24 [--tambour-wheel-flex:none]"
					items={numbers}
					loop
					aria-label="Number"
				/>
			</Tambour.Root>
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
