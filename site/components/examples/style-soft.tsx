"use client";

import { Tambour } from "tambour/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function StyleSoft() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-indigo-50" />
			<Tambour.Root
				aria-label="Time"
				defaultValue={["9", "30"]}
				className="font-medium text-slate-700 [--tambour-band-background:white] [--tambour-band-inset:-14px] [--tambour-band-radius:19px] [--tambour-item-color:var(--color-slate-400)] [&_[data-tambour-band]]:shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
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
