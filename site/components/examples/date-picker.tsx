"use client";

import { Detent } from "detent/react";
import { useMemo, useState } from "react";

const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
].map((label, value) => ({ value, label }));
const years = Array.from({ length: 201 }, (_, i) => 1900 + i);

const daysIn = (month: number, year: number) =>
	new Date(year, month + 1, 0).getDate();

const wheel = "w-[58px] [--detent-wheel-flex:none]";

export function DatePicker() {
	const [date, setDate] = useState([0, 31, 2026]);
	const [month, , year] = date;

	const count = daysIn(month, year);
	const days = useMemo(
		() => Array.from({ length: count }, (_, i) => i + 1),
		[count],
	);

	return (
		<Detent.Root
			aria-label="Date"
			value={date}
			onValueChange={setDate}
			className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
		>
			<Detent.Wheel className={wheel} items={months} loop aria-label="Month" />
			<Detent.Wheel className={wheel} items={days} loop aria-label="Day" />
			<Detent.Wheel
				className="w-[72px] [--detent-wheel-flex:none]"
				items={years}
				aria-label="Year"
			/>
		</Detent.Root>
	);
}
