// Development playground for the core. Everything lives in this one file on
// purpose: it wires the engine to the DOM by hand, without the React adapter.
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createWheel, type Wheel } from "../src/core";

const ITEM_HEIGHT = 36;

// ---------- DOM wiring ----------

/** Every live wheel by name, so the debug panel can read them. */
const registry = new Map<string, Wheel>();

// Starts from the system setting. The debug panel can override it.
const reducedMotionQuery = window.matchMedia(
	"(prefers-reduced-motion: reduce)",
);
let reducedMotion = reducedMotionQuery.matches;

function setReducedMotion(reduced: boolean) {
	reducedMotion = reduced;
	for (const wheel of registry.values()) wheel.setReducedMotion(reduced);
}
reducedMotionQuery.addEventListener("change", () =>
	setReducedMotion(reducedMotionQuery.matches),
);

interface BindOptions {
	name: string;
	items: string[];
	loop?: boolean;
	index: number;
	onChange: (index: number) => void;
}

/**
 * Attaches a core wheel to an element: creates the rows, forwards input and
 * paints each frame.
 */
function bindWheel(element: HTMLElement, options: BindOptions) {
	const { loop = false } = options;
	let items = options.items;

	const updateAria = (index: number) => {
		element.setAttribute("aria-valuenow", String(index));
		element.setAttribute("aria-valuetext", items[index]);
	};

	const wheel = createWheel({
		count: items.length,
		loop,
		index: options.index,
		itemHeight: ITEM_HEIGHT,
		reducedMotion,
		onIndexChange: (index) => {
			updateAria(index);
			options.onChange(index);
		},
	});

	const rows = wheel.slots().map(() => {
		const row = document.createElement("div");
		row.className = "row";
		element.append(row);
		return row;
	});

	const paint = () => {
		for (const slot of wheel.slots()) {
			const row = rows[slot.key];
			if (!slot.visible) {
				row.style.visibility = "hidden";
				continue;
			}
			row.style.visibility = "";
			row.textContent = items[slot.index];
			row.style.transform = `translateY(${slot.y}px) rotateX(${-slot.angle}rad)`;
			row.style.opacity = String(slot.opacity);
			row.classList.toggle("selected", slot.selected);
		}
	};

	const onPointerDown = (event: PointerEvent) => {
		element.setPointerCapture(event.pointerId);
		wheel.pointerDown(event.clientY);
	};
	const onPointerMove = (event: PointerEvent) => {
		wheel.pointerMove(event.clientY);
	};
	const onPointerUp = (event: PointerEvent) => {
		const rect = element.getBoundingClientRect();
		wheel.pointerUp(event.clientY - (rect.top + rect.height / 2));
	};
	const onPointerCancel = () => wheel.pointerCancel();
	const onWheel = (event: WheelEvent) => {
		if (wheel.scroll(event.deltaY, event.deltaMode)) event.preventDefault();
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (wheel.key(event.key)) event.preventDefault();
	};

	element.setAttribute("aria-valuemin", "0");
	element.setAttribute("aria-valuemax", String(items.length - 1));
	element.addEventListener("pointerdown", onPointerDown);
	element.addEventListener("pointermove", onPointerMove);
	element.addEventListener("pointerup", onPointerUp);
	element.addEventListener("pointercancel", onPointerCancel);
	element.addEventListener("keydown", onKeyDown);
	element.addEventListener("wheel", onWheel, { passive: false });
	registry.set(options.name, wheel);
	const unsubscribe = wheel.subscribe(paint);
	updateAria(wheel.index);
	paint();

	return {
		wheel,
		/** Swap the items in place, e.g. when the month changes the days. */
		setItems(next: string[]) {
			items = next;
			element.setAttribute("aria-valuemax", String(items.length - 1));
			wheel.setCount(items.length);
			updateAria(wheel.index);
			paint();
		},
		destroy() {
			unsubscribe();
			wheel.destroy();
			element.removeEventListener("pointerdown", onPointerDown);
			element.removeEventListener("pointermove", onPointerMove);
			element.removeEventListener("pointerup", onPointerUp);
			element.removeEventListener("pointercancel", onPointerCancel);
			element.removeEventListener("keydown", onKeyDown);
			element.removeEventListener("wheel", onWheel);
			if (registry.get(options.name) === wheel) registry.delete(options.name);
			for (const row of rows) row.remove();
		},
	};
}

/** Binds a wheel to a ref for the lifetime of the component. */
function useWheel(options: BindOptions) {
	const ref = useRef<HTMLDivElement>(null);
	const bound = useRef<ReturnType<typeof bindWheel> | null>(null);
	const latest = useRef(options);
	latest.current = options;
	const { items, loop } = options;

	useEffect(() => {
		if (!ref.current) return;
		const current = bindWheel(ref.current, {
			name: latest.current.name,
			items: latest.current.items,
			loop,
			index: latest.current.index,
			onChange: (index) => latest.current.onChange(index),
		});
		bound.current = current;
		return () => {
			current.destroy();
			bound.current = null;
		};
	}, [loop]);

	// New items update the existing wheel rather than rebuilding it, so a
	// linked wheel keeps its position and any motion in progress.
	useEffect(() => {
		bound.current?.setItems(items);
	}, [items]);

	return { ref, wheel: (): Wheel | undefined => bound.current?.wheel };
}

// ---------- Demos ----------

const range = (length: number, from = 0, pad = 0) =>
	Array.from({ length }, (_, i) => String(i + from).padStart(pad, "0"));

const HOURS = range(12, 1);
const MINUTES = range(60, 0, 2);
const PERIODS = ["AM", "PM"];

function TimePicker() {
	const [hour, setHour] = useState(8);
	const [minute, setMinute] = useState(41);
	const [period, setPeriod] = useState(0);

	const hours = useWheel({
		name: "Hour",
		items: HOURS,
		loop: true,
		index: hour,
		onChange: setHour,
	});
	const minutes = useWheel({
		name: "Minute",
		items: MINUTES,
		loop: true,
		index: minute,
		onChange: setMinute,
	});
	const periods = useWheel({
		name: "AM/PM",
		items: PERIODS,
		index: period,
		onChange: setPeriod,
	});

	return (
		<section className="card">
			<header>
				<h2>Time</h2>
				<p>Hours and minutes loop. AM/PM stretches at the ends.</p>
			</header>
			<div className="stage">
				<output className="readout">
					{HOURS[hour]}:{MINUTES[minute]} {PERIODS[period]}
				</output>
				<div className="picker">
					<div className="band" />
					<div
						ref={hours.ref}
						className="column"
						role="spinbutton"
						tabIndex={0}
						aria-label="Hour"
					/>
					<div
						ref={minutes.ref}
						className="column"
						role="spinbutton"
						tabIndex={0}
						aria-label="Minute"
					/>
					<div
						ref={periods.ref}
						className="column"
						role="spinbutton"
						tabIndex={0}
						aria-label="AM or PM"
					/>
				</div>
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
];
const FIRST_YEAR = 1900;
const YEARS = range(201, FIRST_YEAR);

const daysIn = (month: number, year: number) =>
	new Date(year, month + 1, 0).getDate();

function DatePicker() {
	const today = new Date();
	const [month, setMonth] = useState(today.getMonth());
	const [day, setDay] = useState(today.getDate() - 1);
	const [year, setYear] = useState(today.getFullYear() - FIRST_YEAR);

	const dayCount = daysIn(month, year + FIRST_YEAR);
	const days = useMemo(() => range(dayCount, 1), [dayCount]);

	const months = useWheel({
		name: "Month",
		items: MONTHS,
		loop: true,
		index: month,
		onChange: setMonth,
	});
	const dayWheel = useWheel({
		name: "Day",
		items: days,
		loop: true,
		index: day,
		onChange: setDay,
	});
	const years = useWheel({
		name: "Year",
		items: YEARS,
		index: year,
		onChange: setYear,
	});

	// The day wheel catches up a frame later, so clamp for display.
	const date = new Date(
		year + FIRST_YEAR,
		month,
		Math.min(day, dayCount - 1) + 1,
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
					{date.toLocaleDateString(undefined, {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</output>
				<div className="picker">
					<div className="band" />
					<div
						ref={months.ref}
						className="column"
						role="spinbutton"
						tabIndex={0}
						aria-label="Month"
					/>
					<div
						ref={dayWheel.ref}
						className="column"
						role="spinbutton"
						tabIndex={0}
						aria-label="Day"
					/>
					<div
						ref={years.ref}
						className="column wide"
						role="spinbutton"
						tabIndex={0}
						aria-label="Year"
					/>
				</div>
			</div>
		</section>
	);
}

const NUMBERS = range(10_000, 0, 4);

function LargeList() {
	const [value, setValue] = useState(1234);
	const numbers = useWheel({
		name: "Number",
		items: NUMBERS,
		loop: true,
		index: value,
		onChange: setValue,
	});

	const jump = () => {
		const next = Math.floor(Math.random() * NUMBERS.length);
		numbers.wheel()?.setIndex(next, { animate: true });
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
				<output className="readout">{NUMBERS[value]}</output>
				<div className="picker">
					<div className="band" />
					<div
						ref={numbers.ref}
						className="column wider"
						role="spinbutton"
						tabIndex={0}
						aria-label="Number"
					/>
				</div>
				<button type="button" className="button corner" onClick={jump}>
					Jump to random
				</button>
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

function DebugPanel() {
	const [rows, setRows] = useState<DebugRow[]>([]);
	const [reduced, setReduced] = useState(reducedMotion);

	useEffect(() => {
		let frame = requestAnimationFrame(function read() {
			setRows(
				[...registry].map(([name, wheel]) => ({
					name,
					position: wheel.position,
					target: wheel.target,
					velocity: wheel.velocity,
					index: wheel.index,
					count: wheel.count,
				})),
			);
			setReduced(reducedMotion);
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
					onChange={(event) => setReducedMotion(event.target.checked)}
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

// ---------- Page ----------

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

.picker { position: relative; display: flex; gap: 2px; height: 224px; user-select: none; -webkit-user-select: none; }
.band { position: absolute; left: -10px; right: -10px; top: 50%; height: 38px; margin-top: -19px; background: var(--surface); border-radius: 10px; }
.column {
	position: relative; width: 58px; height: 224px; touch-action: none; cursor: grab; perspective: 900px; border-radius: 8px;
	-webkit-mask-image: linear-gradient(transparent, #000 28%, #000 72%, transparent);
	mask-image: linear-gradient(transparent, #000 28%, #000 72%, transparent);
}
.column:active { cursor: grabbing; }
.column.wide { width: 72px; }
.column.wider { width: 96px; }
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
.row {
	position: absolute; left: 0; right: 0; top: 50%; height: ${ITEM_HEIGHT}px; margin-top: -${ITEM_HEIGHT / 2}px;
	line-height: ${ITEM_HEIGHT}px; text-align: center; font-size: 21px; font-variant-numeric: tabular-nums;
	color: var(--muted); backface-visibility: hidden; white-space: nowrap;
}
.row.selected { color: var(--fg); }
`;

function App() {
	return (
		<main>
			<style>{styles}</style>
			<header>
				<h1>detent</h1>
				<p>Core playground. Each picker below drives the engine directly.</p>
			</header>
			<div className="grid">
				<TimePicker />
				<DatePicker />
				<LargeList />
				<DebugPanel />
			</div>
			<p className="spacer">
				Extra room to check that bounded wheels hand scrolling back to the page.
			</p>
		</main>
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
