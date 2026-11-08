import {
	createWheel,
	type Scheduler,
	type Wheel,
	type WheelSlot,
} from "../core";
import { clamp, wrap } from "../core/math";
import type { RootContextValue } from "./context";
import type { ItemModel } from "./items";

/** Rows either side of the center, as the engine lays them out. */
const OVERSCAN = 5;
export const ROW_COUNT = OVERSCAN * 2 + 1;

/** Item height the geometry below was tuned at. */
const BASE_ITEM_HEIGHT = 36;
const BASE_RADIUS = 100;
const BASE_WHEEL_HEIGHT = 224;
const BASE_PERSPECTIVE = 900;
const BASE_BAND_HEIGHT = 38;

/** Scales the approved geometry to an item height, in pixels. */
export function geometry(itemHeight: number) {
	const scale = itemHeight / BASE_ITEM_HEIGHT;
	return {
		radius: BASE_RADIUS * scale,
		wheelHeight: BASE_WHEEL_HEIGHT * scale,
		perspective: BASE_PERSPECTIVE * scale,
		bandHeight: BASE_BAND_HEIGHT * scale,
	};
}

function transformOf(slot: WheelSlot) {
	return `translateY(${slot.y}px) rotateX(${-slot.angle}rad)`;
}

/** What a wheel needs from its latest render. */
export interface BindingProps {
	model: ItemModel;
	root: RootContextValue;
	slot: number;
	loop: boolean;
	disabled: boolean;
	/** Re-renders the wheel, so it can check the parent kept what it reported. */
	onUserSettle: () => void;
}

export interface InitialAria {
	now: number | undefined;
	max: number | undefined;
	text: string | undefined;
}

export interface InitialRow {
	label: string;
	selected: boolean;
	visible: boolean;
	transform: string;
	opacity: number;
}

export interface Binding {
	readonly engine: Wheel;
	/** Row elements by ring position, filled in by React. */
	readonly rows: (HTMLElement | null)[];
	/** Replaced after each render, before anything reads it. */
	props: BindingProps;
	/** The rows to render first, so server markup matches the first paint. */
	initialRows(): InitialRow[];
	initialAria(): InitialAria;
	/** Starts painting and listening. Returns the cleanup. */
	connect(element: HTMLElement): () => void;
	paint(): void;
	/** Runs an input. Returns whether the engine used it. */
	input(call: () => boolean): boolean;
	/** Brings the engine in line with the latest props. */
	sync(): void;
}

export function createBinding(
	initial: BindingProps & { scheduler?: Scheduler },
): Binding {
	const { model, root, slot, loop, disabled, onUserSettle, scheduler } =
		initial;
	const start = model.indexOf(root.value[slot]);

	const engine = createWheel({
		count: model.values.length,
		loop,
		index: Math.max(start, 0),
		itemHeight: root.itemHeight,
		radius: geometry(root.itemHeight).radius,
		overscan: OVERSCAN,
		reducedMotion: root.reducedMotion,
		scheduler,
		onIndexChange(index) {
			if (userDriven && !syncing && index >= 0) write(index);
		},
		onSettle(index) {
			if (!userDriven || syncing || index < 0) return;
			userDriven = false;
			write(index);
			commit(index);
			binding.props.onUserSettle();
		},
	});

	/**
	 * Whether the user is what's moving this wheel. Only then does a new item
	 * get reported: when the wheel is animating towards a value the parent set,
	 * reporting each item it passes would send the wheel back to them.
	 */
	let userDriven = false;
	/** True while applying props, when the engine's reports are just echoes. */
	let syncing = false;
	/** The value last confirmed at rest, to skip commits that change nothing. */
	let lastCommitted: unknown;

	const rows: (HTMLElement | null)[] = [];
	/** The text each row shows, to skip writing what's already there. */
	const shown: string[] = [];
	let element: HTMLElement | null = null;

	/** The engine's index, or what it will be once a shrink has caught up. */
	function currentIndex() {
		return clamp(engine.index, 0, binding.props.model.labels.length - 1);
	}

	function ariaState(labels: readonly string[]): InitialAria {
		if (labels.length === 0) {
			return { now: undefined, max: undefined, text: undefined };
		}
		// While heading to a value the parent set, speak that value and not
		// everything on the way there.
		const now = userDriven ? currentIndex() : headingIndex();
		return { now, max: labels.length - 1, text: labels[now] };
	}

	function setAttribute(name: string, value: string | number | undefined) {
		if (value === undefined) element?.removeAttribute(name);
		else element?.setAttribute(name, String(value));
	}

	let spoken: InitialAria | null = null;
	function updateAria() {
		const next = ariaState(binding.props.model.labels);
		if (
			spoken?.now === next.now &&
			spoken?.max === next.max &&
			spoken?.text === next.text
		) {
			return;
		}
		spoken = next;
		setAttribute("aria-valuenow", next.now);
		setAttribute("aria-valuemax", next.max);
		setAttribute("aria-valuetext", next.text);
	}

	function input(call: () => boolean) {
		const previous = userDriven;
		userDriven = true;
		const used = call();
		// Grabbing the wheel mid-animation makes where it is the new value.
		if (used) write(currentIndex());
		else userDriven = previous;
		return used;
	}

	/** Where the wheel will stop, as an item index. */
	function headingIndex() {
		const count = binding.props.model.values.length;
		const rounded = Math.round(engine.target);
		return engine.loop ? wrap(rounded, count) : clamp(rounded, 0, count - 1);
	}

	/** Records a wheel's new value and tells the consumer. */
	function write(index: number) {
		const { model, root, slot } = binding.props;
		const value = model.values[index];
		const latest = root.latest.current;
		if (Object.is(value, latest[slot])) return;
		latest[slot] = value;
		root.change(Array.from(latest));
	}

	function commit(index: number) {
		const { model, root } = binding.props;
		if (Object.is(model.values[index], lastCommitted)) return;
		lastCommitted = model.values[index];
		root.commit(Array.from(root.latest.current));
	}

	function othersMoving() {
		for (const other of binding.props.root.engines) {
			if (other !== engine && other.moving) return true;
		}
		return false;
	}

	let previousModel: ItemModel | null = null;
	let foundBefore = false;

	function sync() {
		const { model, root, slot, loop } = binding.props;
		const count = model.values.length;
		const previousCount = previousModel?.values.length ?? 0;
		const itemsChanged = previousModel !== null && previousModel !== model;
		previousModel = model;
		const wanted = root.value[slot];
		const latest = root.latest.current;

		syncing = true;
		userDriven = userDriven && engine.moving;
		engine.setCount(count);
		engine.setLoop(loop);

		if (count === 0) {
			// Items can arrive later, so hold on to the value until they do.
			if (wanted !== undefined) latest[slot] = wanted;
			foundBefore = false;
		} else if (!userDriven) {
			// Checked first so a list with repeats doesn't jump to the first one.
			const current = currentIndex();
			const found = Object.is(model.values[current], wanted)
				? current
				: model.indexOf(wanted);
			const heading = headingIndex();
			if (found === -1) {
				if (foundBefore && wanted !== undefined) {
					// The value existed and is now gone, like the 31st in February.
					write(heading);
					// A sibling still moving will commit this along with its own
					// change. Otherwise nothing else will, and it must be reported.
					if (!othersMoving()) commit(heading);
				} else {
					// Never been a match, so it isn't this wheel's to overwrite.
					latest[slot] = lastCommitted =
						wanted !== undefined ? wanted : model.values[heading];
				}
			} else {
				latest[slot] = lastCommitted = wanted;
				// An effect cleanup can stop the engine between two items.
				const stranded = !engine.moving && engine.position !== engine.target;
				if (found !== heading || stranded) {
					engine.setIndex(found, {
						animate: !itemsChanged && previousCount > 0 && !stranded,
					});
				}
			}
			foundBefore = found !== -1;
		}
		syncing = false;
		paint();
	}

	/**
	 * Which row shows a slot. The engine numbers slots by distance from the
	 * center, which shifts on every crossing. Tying rows to the item instead
	 * means only one row changes content each time.
	 */
	const ringOf = (slot: WheelSlot) =>
		wrap(Math.round(engine.position) - OVERSCAN + slot.key, ROW_COUNT);

	function paint() {
		const { labels } = binding.props.model;
		for (const slot of engine.slots()) {
			const ring = ringOf(slot);
			const row = rows[ring];
			if (!row) continue;
			if (!slot.visible) {
				row.style.visibility = "hidden";
				continue;
			}
			row.style.visibility = "";
			const label = labels[slot.index] ?? "";
			if (shown[ring] !== label) {
				row.textContent = label;
				shown[ring] = label;
			}
			row.style.transform = transformOf(slot);
			row.style.opacity = String(slot.opacity);
			row.toggleAttribute("data-selected", slot.selected);
		}
		updateAria();
	}

	const binding: Binding = {
		engine,
		rows,
		props: { model, root, slot, loop, disabled, onUserSettle },

		initialRows() {
			const result: InitialRow[] = [];
			for (const slot of engine.slots()) {
				const ring = ringOf(slot);
				const label = model.labels[slot.index] ?? "";
				shown[ring] = label;
				result[ring] = {
					label,
					selected: slot.selected,
					visible: slot.visible,
					transform: transformOf(slot),
					opacity: slot.opacity,
				};
			}
			return result;
		},

		initialAria() {
			return ariaState(model.labels);
		},

		connect(target) {
			element = target;
			const { engines } = binding.props.root;
			// Native, because React attaches wheel listeners as passive and a
			// passive listener can't stop the page from scrolling.
			const onWheel = (event: WheelEvent) => {
				if (binding.props.disabled) return;
				if (input(() => engine.scroll(event.deltaY, event.deltaMode))) {
					event.preventDefault();
				}
			};
			target.addEventListener("wheel", onWheel, { passive: false });
			const unsubscribe = engine.subscribe(paint);
			engines.add(engine);
			paint();
			return () => {
				target.removeEventListener("wheel", onWheel);
				unsubscribe();
				engines.delete(engine);
				engine.destroy();
				element = null;
				spoken = null;
			};
		},

		paint,
		input,
		sync,
	};

	return binding;
}
