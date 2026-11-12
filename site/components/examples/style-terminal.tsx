"use client";

import { Tambour } from "tambour/react";

const hours = ["07", "08", "09", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function StyleTerminal() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-black" />
			<Tambour.Root
				aria-label="Time"
				defaultValue={["09", "30"]}
				className="font-mono text-green-400 [--tambour-band-background:transparent] [--tambour-band-inset:-10px] [--tambour-band-radius:0] [--tambour-item-color:rgb(74_222_128/0.45)] [--tambour-item-font-size:16px] [&_[data-tambour-band]]:border [&_[data-tambour-band]]:border-green-500/60"
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
