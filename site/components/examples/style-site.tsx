"use client";

import { Detent } from "detent/react";

const hours = ["7", "8", "9", "10", "11", "12"];
const minutes = ["00", "15", "30", "45"];
const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function StyleSite() {
	return (
		<Detent.Root
			aria-label="Time"
			defaultValue={["9", "30"]}
			className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
		>
			<Detent.Wheel className={wheel} items={hours} loop aria-label="Hour" />
			<Detent.Wheel
				className={wheel}
				items={minutes}
				loop
				aria-label="Minute"
			/>
		</Detent.Root>
	);
}
