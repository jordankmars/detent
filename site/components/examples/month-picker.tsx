"use client";

import { Detent } from "detent/react";
import { useState } from "react";

const months = [
	{ value: 0, label: "January" },
	{ value: 1, label: "February" },
	{ value: 2, label: "March" },
	{ value: 3, label: "April" },
	{ value: 4, label: "May" },
	{ value: 5, label: "June" },
	{ value: 6, label: "July" },
	{ value: 7, label: "August" },
	{ value: 8, label: "September" },
	{ value: 9, label: "October" },
	{ value: 10, label: "November" },
	{ value: 11, label: "December" },
];

export function MonthPicker() {
	const [value, setValue] = useState([3]);

	return (
		<>
			<output className="absolute inset-x-0 top-4 text-center font-mono text-xs text-neutral-500 dark:text-neutral-400">
				value: {value[0]}
			</output>
			<Detent.Root
				aria-label="Month"
				value={value}
				onValueChange={setValue}
				className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
			>
				<Detent.Wheel
					className="w-40 [--detent-wheel-flex:none]"
					items={months}
					loop
					aria-label="Month"
				/>
			</Detent.Root>
		</>
	);
}
