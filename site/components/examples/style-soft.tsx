"use client";

import { Detent } from "detent/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function StyleSoft() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-indigo-50" />
			<Detent.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="font-medium text-slate-700 [--detent-band-background:white] [--detent-band-inset:-14px] [--detent-band-radius:19px] [--detent-item-color:var(--color-slate-400)] [&_[data-detent-band]]:shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
			>
				<Detent.Wheel className={wheel} items={hours} loop aria-label="Hour" />
				<Detent.Wheel
					className={wheel}
					items={minutes}
					loop
					aria-label="Minute"
				/>
			</Detent.Root>
		</>
	);
}
