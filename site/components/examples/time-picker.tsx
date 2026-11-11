"use client";

import { Detent } from "detent/react";
import { useState } from "react";

const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const hours = range(12, 1);
const minutes = range(60, 0, 2);
const periods = ["AM", "PM"];

const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function TimePicker() {
	const [time, setTime] = useState(["9", "41", "AM"]);

	return (
		<Detent.Root
			aria-label="Time"
			value={time}
			onValueChange={setTime}
			className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
		>
			<Detent.Wheel className={wheel} items={hours} loop aria-label="Hour" />
			<Detent.Wheel
				className={wheel}
				items={minutes}
				loop
				aria-label="Minute"
			/>
			<Detent.Wheel className={wheel} items={periods} aria-label="AM or PM" />
		</Detent.Root>
	);
}
