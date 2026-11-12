"use client";

import { Tambour } from "tambour/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function StyleBrutalist() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-amber-100" />
			<Tambour.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="font-black text-black [--tambour-band-background:var(--color-yellow-300)] [--tambour-band-inset:-10px] [--tambour-band-radius:0] [--tambour-item-color:rgb(0_0_0/0.45)] [&_[data-tambour-band]]:border-[3px] [&_[data-tambour-band]]:border-black [&_[data-tambour-band]]:shadow-[4px_4px_0_#000]"
			>
				<Tambour.Wheel className={wheel} items={hours} loop aria-label="Hour" />
				<Tambour.Wheel
					className={wheel}
					items={minutes}
					loop
					aria-label="Minute"
				/>
			</Tambour.Root>
		</>
	);
}
