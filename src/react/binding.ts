import {
	createWheel,
	type Scheduler,
	type Wheel,
	type WheelSlot,
} from "../core";
import { wrap } from "../core/math";
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
	/** Starts painting. Returns the cleanup. */
	connect(): () => void;
	paint(): void;
}

export function createBinding(
	initial: BindingProps & { scheduler?: Scheduler },
): Binding {
	const { model, root, slot, loop, scheduler } = initial;
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
	});

	const rows: (HTMLElement | null)[] = [];
	/** The text each row shows, to skip writing what's already there. */
	const shown: string[] = [];

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
	}

	const binding: Binding = {
		engine,
		rows,
		props: { model, root, slot, loop },

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

		connect() {
			const { engines } = binding.props.root;
			const unsubscribe = engine.subscribe(paint);
			engines.add(engine);
			paint();
			return () => {
				unsubscribe();
				engines.delete(engine);
				engine.destroy();
			};
		},

		paint,
	};

	return binding;
}
