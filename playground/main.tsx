// Development playground for the React adapter, with live engine state.
import {
	createContext,
	StrictMode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { Wheel as Engine } from "../src/core";
import { Detent } from "../src/react";
import { InternalContext } from "../src/react/context";

// Engine access for the debug panel

/** Every live engine, with the element that names it. */
const registry = new Map<Engine, HTMLElement>();

const internal = {
	register(engine: Engine, element: HTMLElement) {
		registry.set(engine, element);
		return () => {
			registry.delete(engine);
		};
	},
};

const ReducedMotionContext = createContext(false);

// Demos

const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const HOURS = range(12, 1);
const MINUTES = range(60, 0, 2);
const PERIODS = ["AM", "PM"];

function TimePicker() {
	const reducedMotion = useContext(ReducedMotionContext);
	const [value, setValue] = useState(["9", "41", "AM"]);
	const [hour, minute, period] = value;

	return (
		<section className="card">
			<header>
				<h2>Time</h2>
				<p>Hours and minutes loop. AM/PM stretches at the ends.</p>
			</header>
			<div className="stage">
				<output className="readout">
					{hour}:{minute} {period}
				</output>
				<Detent.Root
					className="picker"
					aria-label="Time"
					value={value}
					onValueChange={setValue}
					reducedMotion={reducedMotion}
				>
					<Detent.Wheel
						className="column"
						items={HOURS}
						loop
						aria-label="Hour"
					/>
					<Detent.Wheel
						className="column"
						items={MINUTES}
						loop
						aria-label="Minute"
					/>
					<Detent.Wheel
						className="column"
						items={PERIODS}
						aria-label="AM or PM"
					/>
				</Detent.Root>
			</div>
		</section>
	);
}

const MONTHS = [
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
const YEARS = Array.from({ length: 201 }, (_, i) => 1900 + i);

const daysIn = (month: number, year: number) =>
	new Date(year, month + 1, 0).getDate();

function DatePicker() {
	const reducedMotion = useContext(ReducedMotionContext);
	const [value, setValue] = useState(() => {
		const today = new Date();
		return [today.getMonth(), today.getDate(), today.getFullYear()];
	});
	const [month, day, year] = value;

	const dayCount = daysIn(month, year);
	const days = useMemo(
		() => Array.from({ length: dayCount }, (_, i) => i + 1),
		[dayCount],
	);

	return (
		<section className="card">
			<header>
				<h2>Date</h2>
				<p>
					Days follow the month and year. Try the 31st, then February, then a
					leap year.
				</p>
			</header>
			<div className="stage">
				<output className="readout">
					{new Date(year, month, day).toLocaleDateString(undefined, {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</output>
				<Detent.Root
					className="picker"
					aria-label="Date"
					value={value}
					onValueChange={setValue}
					reducedMotion={reducedMotion}
				>
					<Detent.Wheel
						className="column"
						items={MONTHS}
						loop
						aria-label="Month"
					/>
					<Detent.Wheel className="column" items={days} loop aria-label="Day" />
					<Detent.Wheel
						className="column wide"
						items={YEARS}
						aria-label="Year"
					/>
				</Detent.Root>
			</div>
		</section>
	);
}

const NUMBERS = range(10_000, 0, 4);

function LargeList() {
	const reducedMotion = useContext(ReducedMotionContext);
	const [value, setValue] = useState(["1234"]);

	const jump = () => {
		setValue([NUMBERS[Math.floor(Math.random() * NUMBERS.length)]]);
	};

	return (
		<section className="card">
			<header>
				<h2>Large list</h2>
				<p>
					Ten thousand looping values. Only eleven rows are ever in the DOM.
				</p>
			</header>
			<div className="stage">
				<output className="readout">{value[0]}</output>
				<Detent.Root
					className="picker"
					aria-label="Number"
					value={value}
					onValueChange={setValue}
					reducedMotion={reducedMotion}
				>
					<Detent.Wheel
						className="column wider"
						items={NUMBERS}
						loop
						aria-label="Number"
					/>
				</Detent.Root>
				<button type="button" className="button corner" onClick={jump}>
					Jump to random
				</button>
			</div>
		</section>
	);
}

const COUNTRIES = [
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
type Country = (typeof COUNTRIES)[number];

const getCode = (country: Country) => country.code;
const getName = (country: Country) => country.name;
const renderCountry = (country: Country) => (
	<>
		<span className="flag">{country.flag}</span> {country.name}
	</>
);

function CustomRows() {
	const reducedMotion = useContext(ReducedMotionContext);
	const [value, setValue] = useState(["jp"]);
	const [committed, setCommitted] = useState(value);

	return (
		<section className="card">
			<header>
				<h2>Custom rows</h2>
				<p>
					Rows from renderItem, spoken by name. The readout updates when the
					wheel comes to rest.
				</p>
			</header>
			<div className="stage">
				<output className="readout">{committed[0]}</output>
				<Detent.Root
					className="picker"
					aria-label="Country"
					value={value}
					onValueChange={setValue}
					onValueCommit={setCommitted}
					reducedMotion={reducedMotion}
				>
					<Detent.Wheel
						className="column widest"
						items={COUNTRIES}
						getValue={getCode}
						getLabel={getName}
						renderItem={renderCountry}
						loop
						aria-label="Country"
					/>
				</Detent.Root>
			</div>
		</section>
	);
}

interface DebugRow {
	name: string;
	position: number;
	target: number;
	velocity: number;
	index: number;
	count: number;
}

function DebugPanel({
	reduced,
	onReducedChange,
}: {
	reduced: boolean;
	onReducedChange: (reduced: boolean) => void;
}) {
	const [rows, setRows] = useState<DebugRow[]>([]);

	useEffect(() => {
		let frame = requestAnimationFrame(function read() {
			setRows(
				[...registry].map(([engine, element]) => ({
					name: element.getAttribute("aria-label") ?? "",
					position: engine.position,
					target: engine.target,
					velocity: engine.velocity,
					index: engine.index,
					count: engine.count,
				})),
			);
			frame = requestAnimationFrame(read);
		});
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<section className="card">
			<header>
				<h2>Engine state</h2>
				<p>Live values from every wheel on the page, in items.</p>
			</header>
			<label className="toggle">
				<input
					type="checkbox"
					checked={reduced}
					onChange={(event) => onReducedChange(event.target.checked)}
				/>
				Reduce motion
			</label>
			<div className="table">
				<table>
					<thead>
						<tr>
							<th>Wheel</th>
							<th>Position</th>
							<th>Target</th>
							<th>Velocity</th>
							<th>Index</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.name}>
								<td>{row.name}</td>
								<td>{row.position.toFixed(3)}</td>
								<td>{row.target.toFixed(3)}</td>
								<td>{row.velocity.toFixed(2)}</td>
								<td>
									{row.index} / {row.count}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

// Page

const styles = `
:root {
	--bg: #f6f6f8;
	--surface: #ffffff;
	--stage: #ececf0;
	--fg: #16161a;
	--muted: #6a6a75;
	--line: #e2e2e8;
	--accent: #2d55e0;
	color-scheme: light;
}
@media (prefers-color-scheme: dark) {
	:root {
		--bg: #0e0e11;
		--surface: #1a1a1f;
		--stage: #121216;
		--fg: #ececf1;
		--muted: #9b9ba8;
		--line: #2a2a31;
		--accent: #7390ff;
		color-scheme: dark;
	}
}
* { box-sizing: border-box; }
body {
	margin: 0;
	background: var(--bg);
	color: var(--fg);
	font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
	-webkit-font-smoothing: antialiased;
}
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
h1, h2, p { margin: 0; }
main { max-width: 1100px; margin: 0 auto; padding: 40px 16px 64px; display: grid; gap: 24px; }
main > header h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
main > header p { color: var(--muted); }
.grid { display: grid; gap: 16px; }
@media (min-width: 860px) { .grid { grid-template-columns: 1fr 1fr; } }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: grid; gap: 12px; align-content: start; min-width: 0; }
.card header { display: grid; gap: 2px; }
.card h2 { font-size: 15px; font-weight: 600; }
.card header p { color: var(--muted); font-size: 13px; }
.stage { position: relative; height: 320px; background: var(--stage); border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.readout { position: absolute; top: 14px; left: 0; right: 0; text-align: center; font: 12px ui-monospace, Menlo, monospace; color: var(--muted); }

[data-detent-band] { left: -10px; right: -10px; background: var(--surface); }
[data-detent-item] { color: var(--muted); }
[data-detent-item][data-selected] { color: var(--fg); }
.column { flex: none; width: 58px; border-radius: 8px; }
.column.wide { width: 72px; }
.column.wider { width: 96px; }
.column.widest { width: 230px; }
.flag { font-size: 18px; }

.button { font: inherit; font-size: 12.5px; color: inherit; border: 0; padding: 5px 12px; border-radius: 7px; background: var(--surface); cursor: pointer; }
.button:hover { background: var(--line); }
.corner { position: absolute; right: 12px; bottom: 12px; }
.toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.toggle input { accent-color: var(--accent); }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font: 12px ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }
th, td { text-align: right; padding: 6px 8px; border-top: 1px solid var(--line); white-space: nowrap; }
th { color: var(--muted); font-weight: 500; border-top: 0; }
th:first-child, td:first-child { text-align: left; }
.spacer { height: 60vh; display: grid; place-items: center; color: var(--muted); font-size: 13px; }
`;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function App() {
	const [reduced, setReduced] = useState(
		() => window.matchMedia(REDUCED_MOTION).matches,
	);

	return (
		<InternalContext.Provider value={internal}>
			<ReducedMotionContext.Provider value={reduced}>
				<main>
					<style>{styles}</style>
					<header>
						<h1>detent</h1>
						<p>React adapter playground, with live engine state.</p>
					</header>
					<div className="grid">
						<TimePicker />
						<DatePicker />
						<LargeList />
						<CustomRows />
						<DebugPanel reduced={reduced} onReducedChange={setReduced} />
					</div>
					<p className="spacer">
						Extra room to check that bounded wheels hand scrolling back to the
						page.
					</p>
				</main>
			</ReducedMotionContext.Provider>
		</InternalContext.Provider>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
