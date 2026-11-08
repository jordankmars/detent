import {
	browserScheduler,
	type Scheduler,
	sharedFrameLoop,
} from "./frame-loop";
import { clamp, rubberBand, wrap } from "./math";
import { type SpringConfig, stepSpring } from "./spring";
import { createVelocityTracker } from "./velocity";

export interface WheelOptions {
	/** Number of items in the wheel. */
	count: number;
	/** Wrap around from the last item to the first. */
	loop?: boolean;
	/** Initially selected index. */
	index?: number;
	/** Height of one item in pixels. Converts pointer movement into items. */
	itemHeight?: number;
	/** Radius of the cylinder the items sit on, in pixels. */
	radius?: number;
	/** Degrees of the cylinder each item takes up. */
	itemAngle?: number;
	/** Items rendered either side of the selected one. */
	overscan?: number;
	/** Called when the item under the center band changes. */
	onIndexChange?: (index: number) => void;
	/** Clock and frame source. Defaults to requestAnimationFrame. */
	scheduler?: Scheduler;
}

/** One rendered row of the cylinder. */
export interface WheelSlot {
	/** Stable per row, so a renderer can reuse the same node every frame. */
	key: number;
	/** Item shown in this row, or -1 past the ends of a non-looping wheel. */
	index: number;
	/** Distance from the center band, in items. */
	offset: number;
	/** Rotation around the cylinder's axis, in radians. */
	angle: number;
	/** Vertical offset from the center, in pixels. */
	y: number;
	opacity: number;
	visible: boolean;
	/** True for the row inside the center band. */
	selected: boolean;
}

export interface Wheel {
	/** Continuous scroll position in items. Not wrapped when looping. */
	readonly position: number;
	/** Where the wheel is heading. Equal to `position` when at rest. */
	readonly target: number;
	/** Current speed in items per second. */
	readonly velocity: number;
	/** The selected item, wrapped into `0..count - 1`. */
	readonly index: number;
	readonly count: number;
	readonly loop: boolean;
	readonly dragging: boolean;

	/** Layout for the rows around the current position. */
	slots(): WheelSlot[];

	/** Start a drag at the pointer's vertical position in pixels. */
	pointerDown(y: number, time?: number): void;
	pointerMove(y: number, time?: number): void;
	/**
	 * Release the drag and let it coast to the nearest item. Pass the
	 * pointer's distance from the wheel's vertical center, in pixels, and a
	 * press that never moved selects the item under it.
	 */
	pointerUp(offsetFromCenter?: number): void;
	pointerCancel(): void;

	/** Select an item, either jumping there or animating along the shortest path. */
	setIndex(index: number, options?: { animate?: boolean }): void;

	/** Called whenever the position changes, including every animation frame. */
	subscribe(listener: () => void): () => void;
	destroy(): void;
}

const SPRING: SpringConfig = { duration: 0.55, bounce: 0, rest: 0.001 };
/** Pixels of movement before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 3;
/** How far, in items, the ends stretch before resisting completely. */
const STRETCH = 1.5;
/** Fastest flick we honour, in items per second. */
const MAX_VELOCITY = 40;
/** Seconds of coasting used to project where a flick would end up. */
const PROJECTION = 0.2;

interface Drag {
	y: number;
	start: number;
	moved: boolean;
}

export function createWheel(options: WheelOptions): Wheel {
	const scheduler = options.scheduler ?? browserScheduler;
	const frames = sharedFrameLoop(scheduler);
	const tracker = createVelocityTracker();
	const listeners = new Set<() => void>();
	const itemHeight = options.itemHeight ?? 36;
	const radius = options.radius ?? 100;
	const itemAngle = ((options.itemAngle ?? 21) * Math.PI) / 180;
	const overscan = options.overscan ?? 5;
	const loop = options.loop ?? false;
	const count = options.count;

	let position = normalize(options.index ?? 0);
	let target = position;
	let velocity = 0;
	let index = indexAt(position);
	let drag: Drag | null = null;

	function normalize(value: number) {
		return loop ? value : clamp(value, 0, count - 1);
	}

	function indexAt(value: number) {
		const rounded = Math.round(value);
		return loop ? wrap(rounded, count) : clamp(rounded, 0, count - 1);
	}

	function notify() {
		const next = indexAt(position);
		if (next !== index) {
			index = next;
			options.onIndexChange?.(index);
		}
		for (const listener of listeners) listener();
	}

	function tick(dt: number) {
		const step = stepSpring(position, velocity, target, SPRING, dt);
		position = step.x;
		velocity = step.v;
		notify();
		return !step.done;
	}

	/** Pin the wheel in place, stopping any animation. */
	function hold(value: number) {
		frames.remove(tick);
		position = target = value;
		velocity = 0;
		notify();
	}

	/** Animate to a target, optionally starting with some velocity. */
	function settle(to: number, from = velocity) {
		target = normalize(to);
		velocity = from;
		frames.add(tick);
	}

	function release() {
		const flick = clamp(tracker.velocity(), -MAX_VELOCITY, MAX_VELOCITY);
		settle(Math.round(position + flick * PROJECTION), flick);
	}

	return {
		get position() {
			return position;
		},
		get target() {
			return target;
		},
		get velocity() {
			return velocity;
		},
		get index() {
			return index;
		},
		get count() {
			return count;
		},
		get loop() {
			return loop;
		},
		get dragging() {
			return drag !== null;
		},

		slots() {
			const base = Math.round(position);
			const slots: WheelSlot[] = [];
			for (let key = 0; key <= overscan * 2; key++) {
				const item = base - overscan + key;
				const offset = item - position;
				const angle = offset * itemAngle;
				const inRange = loop || (item >= 0 && item < count);
				const visible = inRange && Math.abs(angle) <= Math.PI / 2;
				slots.push({
					key,
					index: inRange ? wrap(item, count) : -1,
					offset,
					angle,
					y: radius * Math.sin(angle),
					opacity: Math.max(0, Math.cos(angle)) ** 1.4,
					visible,
					selected: Math.abs(offset) < 0.5,
				});
			}
			return slots;
		},

		pointerDown(y, time = scheduler.now()) {
			drag = { y, start: position, moved: false };
			tracker.reset();
			hold(position);
			tracker.add(position, time);
		},

		pointerMove(y, time = scheduler.now()) {
			if (!drag) return;
			const dy = y - drag.y;
			if (Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;

			let next = drag.start - dy / itemHeight;
			if (!loop) {
				const last = count - 1;
				if (next < 0) next = -rubberBand(-next, STRETCH);
				else if (next > last) next = last + rubberBand(next - last, STRETCH);
			}
			hold(next);
			tracker.add(next, time);
		},

		pointerUp(offsetFromCenter) {
			if (!drag) return;
			const { moved } = drag;
			drag = null;
			if (!moved && offsetFromCenter !== undefined) {
				// Undo the cylinder projection to find which row was under the pointer.
				const sine = clamp(offsetFromCenter / radius, -1, 1);
				const rows = Math.asin(sine) / itemAngle;
				return settle(Math.round(position + rows), 0);
			}
			release();
		},

		pointerCancel() {
			if (!drag) return;
			drag = null;
			release();
		},

		setIndex(next, { animate = false } = {}) {
			drag = null;
			if (!animate) return hold(normalize(next));
			if (loop) {
				// Take the short way round rather than spinning past every item.
				const delta = wrap(next - Math.round(target), count);
				next = Math.round(target) + (delta > count / 2 ? delta - count : delta);
			}
			settle(next, 0);
		},

		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},

		destroy() {
			frames.remove(tick);
			listeners.clear();
			drag = null;
		},
	};
}
