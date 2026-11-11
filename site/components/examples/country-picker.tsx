"use client";

import { Detent } from "detent/react";
import { useState } from "react";

const countries = [
	{ code: "ar", name: "Argentina", flag: "🇦🇷" },
	{ code: "br", name: "Brazil", flag: "🇧🇷" },
	{ code: "ca", name: "Canada", flag: "🇨🇦" },
	{ code: "de", name: "Germany", flag: "🇩🇪" },
	{ code: "fr", name: "France", flag: "🇫🇷" },
	{ code: "in", name: "India", flag: "🇮🇳" },
	{ code: "jp", name: "Japan", flag: "🇯🇵" },
	{ code: "ke", name: "Kenya", flag: "🇰🇪" },
	{ code: "nz", name: "New Zealand", flag: "🇳🇿" },
	{ code: "us", name: "United States", flag: "🇺🇸" },
];
type Country = (typeof countries)[number];

const getCode = (country: Country) => country.code;
const getName = (country: Country) => country.name;
const renderCountry = (country: Country) => (
	<>
		<span className="text-lg">{country.flag}</span> {country.name}
	</>
);

export function CountryPicker() {
	const [value, setValue] = useState(["jp"]);
	const [committed, setCommitted] = useState(value);

	return (
		<>
			<output className="absolute inset-x-0 top-4 text-center font-mono text-xs text-neutral-500 dark:text-neutral-400">
				committed: {committed[0]}
			</output>
			<Detent.Root
				aria-label="Country"
				value={value}
				onValueChange={setValue}
				onValueCommit={setCommitted}
				className="[--detent-band-background:var(--color-neutral-100)] [--detent-band-inset:-10px] [--detent-item-color:var(--color-neutral-400)] dark:[--detent-band-background:var(--color-neutral-800)] dark:[--detent-item-color:var(--color-neutral-500)]"
			>
				<Detent.Wheel
					className="w-[230px] [--detent-wheel-flex:none]"
					items={countries}
					getValue={getCode}
					getLabel={getName}
					renderItem={renderCountry}
					loop
					aria-label="Country"
				/>
			</Detent.Root>
		</>
	);
}
