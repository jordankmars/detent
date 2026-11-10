"use client";

import { Detent } from "detent/react";
import { useState } from "react";

// The playground's time picker (playground/main.tsx), styled through Detent's
// variables: its defaults beat Tailwind's layered utilities on the same
// property, but read these.
const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const HOURS = range(12, 1);
const MINUTES = range(60, 0, 2);
const PERIODS = ["AM", "PM"];

const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function HeroTimePicker() {
	const [value, setValue] = useState(["9", "41", "AM"]);

	return (
		<Detent.Root
			aria-label="Time"
			value={value}
			onValueChange={setValue}
			className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
		>
			<Detent.Wheel className={wheel} items={HOURS} loop aria-label="Hour" />
			<Detent.Wheel
				className={wheel}
				items={MINUTES}
				loop
				aria-label="Minute"
			/>
			<Detent.Wheel className={wheel} items={PERIODS} aria-label="AM or PM" />
		</Detent.Root>
	);
}
