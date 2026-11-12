"use client";

import { useMemo, useState } from "react";
import { Tambour } from "tambour/react";

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

const wheel = "w-[58px] [--tambour-wheel-flex:none]";

export function DatePicker() {
	const [date, setDate] = useState([0, 31, 2026]);
	const [month, , year] = date;

	const count = daysIn(month, year);
	const days = useMemo(
		() => Array.from({ length: count }, (_, i) => i + 1),
		[count],
	);

	return (
		<Tambour.Root
			aria-label="Date"
			value={date}
			onValueChange={setDate}
			className="[--tambour-band-background:var(--color-neutral-100)] [--tambour-band-inset:-10px] [--tambour-item-color:var(--color-neutral-400)] dark:[--tambour-band-background:var(--color-neutral-800)] dark:[--tambour-item-color:var(--color-neutral-500)]"
		>
			<Tambour.Wheel className={wheel} items={months} loop aria-label="Month" />
			<Tambour.Wheel className={wheel} items={days} loop aria-label="Day" />
			<Tambour.Wheel
				className="w-[72px] [--tambour-wheel-flex:none]"
				items={years}
				aria-label="Year"
			/>
		</Tambour.Root>
	);
}
