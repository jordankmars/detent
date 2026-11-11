"use client";

import { Detent } from "detent/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function StyleBrutalist() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-amber-100" />
			<Detent.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="font-black text-black [--detent-band-background:var(--color-yellow-300)] [--detent-band-inset:-10px] [--detent-band-radius:0] [--detent-item-color:rgb(0_0_0/0.45)] [&_[data-detent-band]]:border-[3px] [&_[data-detent-band]]:border-black [&_[data-detent-band]]:shadow-[4px_4px_0_#000]"
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
