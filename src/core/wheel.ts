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
	/**
	 * Jump straight to each item instead of animating. Pass the user's
	 * `prefers-reduced-motion` setting. Dragging still follows the pointer.
	 */
	reducedMotion?: boolean;
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

	/**
	 * Handle a key press. Returns true when the key was used, so the caller
	 * knows to prevent the default action.
	 */
	key(key: string): boolean;

	/**
	 * Handle a wheel or trackpad scroll. Pass the event's `deltaY` and
	 * `deltaMode`. Returns true when the wheel used the scroll, so the caller
	 * knows to prevent the page from scrolling.
	 *
	 * A scroll that starts by pushing a bounded wheel past its end goes to the
	 * page instead. Once a scroll gesture picks the wheel or the page, it stays
	 * there until it pauses, so it never switches halfway through.
	 */
	scroll(deltaY: number, deltaMode?: number): boolean;

	/**
	 * Change the number of items, for wheels that depend on each other, like
	 * days in a month. Keeps the selected item where it is. If it no longer
	 * exists, a bounded wheel animates to the new last item and a looping one
	 * moves straight there, since the items in between are gone.
	 */
	setCount(count: number): void;

	/** Turn animation off or back on, e.g. when the user's preference changes. */
	setReducedMotion(reduced: boolean): void;

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
/** Fraction of each scroll delta applied, so the wheel doesn't feel twitchy. */
const SCROLL_SCALE = 0.6;
/** Milliseconds without a scroll event before snapping to an item. */
const SCROLL_IDLE = 120;
/**
 * Pixel deltas below this come from a trackpad or a smooth-scrolling mouse.
 * Larger ones are coarse mouse wheel notches.
 */
const NOTCH_PIXELS = 50;
/** Items in one "page" when the browser reports scroll by pages. */
const PAGE_ITEMS = 5;
/** How far, in items, scrolling may push past the ends before it stops. */
const SCROLL_OVERSHOOT = 0.3;
/** Items moved per key press. */
const KEY_STEPS: Record<string, number> = {
	ArrowUp: -1,
	ArrowDown: 1,
	PageUp: -5,
	PageDown: 5,
};

interface ScrollGesture {
	owner: "wheel" | "page";
	/** Follow deltas exactly (trackpad) rather than easing to them (notches). */
	smooth: boolean;
	/** Time of the latest event in the gesture, in milliseconds. */
	last: number;
}

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
	let count = options.count;

	let position = normalize(options.index ?? 0);
	let target = position;
	let velocity = 0;
	let index = indexAt(position);
	let drag: Drag | null = null;
	let scrollTimer = 0;
	let gesture: ScrollGesture | null = null;
	let reducedMotion = options.reducedMotion ?? false;

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

	function cancelScroll() {
		if (scrollTimer) scheduler.clearTimeout(scrollTimer);
		scrollTimer = 0;
	}

	/** Pin the wheel in place, stopping any animation. */
	function hold(value: number) {
		cancelScroll();
		frames.remove(tick);
		position = target = value;
		velocity = 0;
		notify();
	}

	/** Animate to a target, optionally starting with some velocity. */
	function settle(to: number, from = 0) {
		cancelScroll();
		target = normalize(to);
		if (reducedMotion) return hold(target);
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

		key(key) {
			const step = KEY_STEPS[key];
			if (step) {
				// Step from where the wheel is heading, so quick presses add up.
				settle(Math.round(target) + step);
				return true;
			}
			if (loop) return false;
			if (key === "Home") {
				settle(0);
				return true;
			}
			if (key === "End") {
				settle(count - 1);
				return true;
			}
			return false;
		},

		scroll(deltaY, deltaMode = 0) {
			if (drag) return true;
			const items =
				deltaMode === 1
					? deltaY
					: deltaMode === 2
						? deltaY * PAGE_ITEMS
						: deltaY / itemHeight;

			const now = scheduler.now();
			if (!gesture || now - gesture.last >= SCROLL_IDLE) {
				const atStart = target <= 0 && items < 0;
				const atEnd = target >= count - 1 && items > 0;
				const outward = !loop && (atStart || atEnd);
				gesture = {
					owner: outward ? "page" : "wheel",
					// Decided once: a hard trackpad flick has large deltas in the middle
					// and switching paths partway through makes the wheel jump.
					smooth: deltaMode === 0 && Math.abs(deltaY) < NOTCH_PIXELS,
					last: now,
				};
			}
			gesture.last = now;
			if (gesture.owner === "page") return false;

			let next = target + items * SCROLL_SCALE;
			if (!loop) {
				next = clamp(next, -SCROLL_OVERSHOOT, count - 1 + SCROLL_OVERSHOOT);
			}
			cancelScroll();
			if (reducedMotion || gesture.smooth) {
				// Trackpads send a stream of small deltas, then their own momentum.
				// Following them exactly means the wheel stops where the fingers
				// do, instead of a spring carrying it on past.
				frames.remove(tick);
				position = target = next;
				velocity = 0;
				notify();
			} else {
				// Notches are coarse, so ease towards them.
				target = next;
				frames.add(tick);
			}
			// Snap to an item once the scroll goes quiet.
			scrollTimer = scheduler.setTimeout(() => {
				scrollTimer = 0;
				settle(Math.round(target));
			}, SCROLL_IDLE);
			return true;
		},

		setCount(next) {
			if (next === count) return;
			if (loop) {
				// Re-base the unwrapped position onto the same item in the new range,
				// otherwise a looping wheel would show a different item. Anything
				// past the new end shifts onto the last item.
				const kept = Math.min(index, next - 1);
				const shift = kept - Math.round(position);
				position += shift;
				target += shift;
				if (drag) drag.start += shift;
				count = next;
				return notify();
			}
			count = next;
			if (target > count - 1 && !drag) {
				settle(count - 1, velocity);
			} else {
				notify();
			}
		},

		setReducedMotion(reduced) {
			reducedMotion = reduced;
			if (reduced && frames.has(tick)) hold(target);
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
			cancelScroll();
			frames.remove(tick);
			listeners.clear();
			drag = null;
		},
	};
}
