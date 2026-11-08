"use client";

import { useContext } from "react";
import { RootContext, SlotContext } from "./context";

export interface WheelProps {
	/** Position in the Root's value. Only needed inside your own component. */
	index?: number;
}

export function Wheel({ index }: WheelProps) {
	const root = useContext(RootContext);
	const assigned = useContext(SlotContext);
	if (!root) throw new Error("Detent.Wheel must be inside Detent.Root.");
	const slot = index ?? assigned;
	if (slot === undefined) {
		throw new Error(
			"Detent.Wheel can't find its position. Pass an `index` prop when " +
				"rendering it inside your own component.",
		);
	}
	return (
		<div
			data-detent-wheel=""
			role="spinbutton"
			tabIndex={0}
			aria-valuenow={slot}
			aria-valuetext={String(root.value[slot])}
		/>
	);
}
