"use client";

import { Detent } from "detent/react";

const hours = ["07", "08", "09", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function StyleTerminal() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-black" />
			<Detent.Root
				aria-label="Time"
				defaultValue={["09", "30"]}
				className="font-mono text-green-400 [--detent-band-background:transparent] [--detent-band-inset:-10px] [--detent-band-radius:0] [--detent-item-color:rgb(74_222_128/0.45)] [--detent-item-font-size:16px] [&_[data-detent-band]]:border [&_[data-detent-band]]:border-green-500/60"
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
