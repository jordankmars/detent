import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { highlight } from "@/lib/highlight";
import { ExampleTabs } from "./example-tabs";
import { CountryPicker } from "./examples/country-picker";
import { DatePicker } from "./examples/date-picker";
import { MonthPicker } from "./examples/month-picker";
import { TimePicker } from "./examples/time-picker";

const DEMOS = {
	"country-picker": CountryPicker,
	"date-picker": DatePicker,
	"month-picker": MonthPicker,
	"time-picker": TimePicker,
};

/** Runs `components/examples/<name>.tsx` and shows that same file as its code. */
export async function Example({ name }: { name: keyof typeof DEMOS }) {
	const source = await readFile(
		join(process.cwd(), "components/examples", `${name}.tsx`),
		"utf8",
	);
	// Lint notes are for this repo, not for someone copying the example.
	const code = source
		.split("\n")
		.filter((line) => !line.includes("biome-ignore"))
		.join("\n")
		.trimEnd();
	const Demo = DEMOS[name];
	return (
		<ExampleTabs view={<Demo />} html={await highlight(code)} code={code} />
	);
}
