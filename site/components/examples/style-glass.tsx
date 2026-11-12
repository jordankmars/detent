"use client";

import { Tambour } from "tambour/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function StyleGlass() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-linear-to-br from-fuchsia-500 via-violet-500 to-sky-400" />
			<Tambour.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="text-white [--tambour-band-background:rgb(255_255_255/0.2)] [--tambour-band-inset:-10px] [--tambour-band-radius:999px] [--tambour-item-color:rgb(255_255_255/0.6)] [&_[data-tambour-band]]:border [&_[data-tambour-band]]:border-white/30 [&_[data-tambour-band]]:shadow-xl [&_[data-tambour-band]]:shadow-black/20 [&_[data-tambour-band]]:backdrop-blur-xl [&_[data-tambour-band]]:backdrop-saturate-150"
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
