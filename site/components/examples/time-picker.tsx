"use client";

import { useState } from "react";
import { Tambour } from "tambour/react";

const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const hours = range(12, 1);
const minutes = range(60, 0, 2);
const periods = ["AM", "PM"];

const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function TimePicker() {
	const [time, setTime] = useState(["9", "41", "AM"]);

	return (
		<Tambour.Root
			aria-label="Time"
			value={time}
			onValueChange={setTime}
			className="[--tambour-band-background:var(--color-neutral-100)] [--tambour-band-inset:-10px] [--tambour-item-color:var(--color-neutral-400)] dark:[--tambour-band-background:var(--color-neutral-800)] dark:[--tambour-item-color:var(--color-neutral-500)]"
		>
			<Tambour.Wheel className={wheel} items={hours} loop aria-label="Hour" />
			<Tambour.Wheel
				className={wheel}
				items={minutes}
				loop
				aria-label="Minute"
			/>
			<Tambour.Wheel className={wheel} items={periods} aria-label="AM or PM" />
		</Tambour.Root>
	);
}
