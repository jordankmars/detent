"use client";

import { Tambour } from "tambour/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function StyleSite() {
	return (
		<Tambour.Root
			aria-label="Time"
			defaultValue={["9", "30"]}
			className="[--tambour-band-background:var(--color-neutral-100)] [--tambour-band-inset:-10px] [--tambour-item-color:var(--color-neutral-400)] dark:[--tambour-band-background:var(--color-neutral-800)] dark:[--tambour-item-color:var(--color-neutral-500)]"
		>
			<Tambour.Wheel className={wheel} items={hours} loop aria-label="Hour" />
			<Tambour.Wheel
				className={wheel}
				items={minutes}
				loop
				aria-label="Minute"
			/>
		</Tambour.Root>
	);
}
