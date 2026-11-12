"use client";

import { useState } from "react";
import { Tambour } from "tambour/react";

// The playground's time picker (playground/main.tsx), styled through Tambour's
// variables: its defaults beat Tailwind's layered utilities on the same
// property, but read these.
const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const HOURS = range(12, 1);
const MINUTES = range(60, 0, 2);
const PERIODS = ["AM", "PM"];

const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function HeroTimePicker() {
	const [value, setValue] = useState(["9", "41", "AM"]);

	return (
		<Tambour.Root
			aria-label="Time"
			value={value}
			onValueChange={setValue}
			className="[--tambour-band-background:var(--color-neutral-100)] [--tambour-band-inset:-10px] [--tambour-item-color:var(--color-neutral-400)] dark:[--tambour-band-background:var(--color-neutral-800)] dark:[--tambour-item-color:var(--color-neutral-500)]"
		>
			<Tambour.Wheel className={wheel} items={HOURS} loop aria-label="Hour" />
			<Tambour.Wheel
				className={wheel}
				items={MINUTES}
				loop
				aria-label="Minute"
			/>
			<Tambour.Wheel className={wheel} items={PERIODS} aria-label="AM or PM" />
		</Tambour.Root>
	);
}
