"use client";

import { Detent } from "detent/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function StyleGlass() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-linear-to-br from-fuchsia-500 via-violet-500 to-sky-400" />
			<Detent.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="text-white [--detent-band-background:rgb(255_255_255/0.2)] [--detent-band-inset:-10px] [--detent-band-radius:999px] [--detent-item-color:rgb(255_255_255/0.6)] [&_[data-detent-band]]:border [&_[data-detent-band]]:border-white/30 [&_[data-detent-band]]:shadow-xl [&_[data-detent-band]]:shadow-black/20 [&_[data-detent-band]]:backdrop-blur-xl [&_[data-detent-band]]:backdrop-saturate-150"
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
