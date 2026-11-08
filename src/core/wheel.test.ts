import { describe, expect, it } from "vitest";
import { createManualScheduler } from "./testing";
import { createWheel, type WheelOptions } from "./wheel";

const ITEM = 36;

function setup(options: Partial<WheelOptions> = {}) {
	const scheduler = createManualScheduler();
	const changes: number[] = [];
	const wheel = createWheel({
		count: 12,
		scheduler,
		onIndexChange: (index) => changes.push(index),
		...options,
	});
	return { wheel, scheduler, changes };
}

/** Drag by `dy` pixels over `ms`, in 16ms pointer events. */
function drag(
	{ wheel, scheduler }: ReturnType<typeof setup>,
	dy: number,
	ms: number,
) {
	const steps = Math.max(1, Math.round(ms / 16));
	wheel.pointerDown(0);
	for (let i = 1; i <= steps; i++) {
		scheduler.wait(ms / steps);
		wheel.pointerMove((dy * i) / steps);
	}
}

describe("createWheel", () => {
	it("starts at the given index", () => {
		const { wheel } = setup({ index: 4 });
		expect(wheel.index).toBe(4);
		expect(wheel.position).toBe(4);
	});

	it("clamps the starting index when not looping", () => {
		expect(setup({ index: 40 }).wheel.index).toBe(11);
		expect(setup({ index: -3 }).wheel.index).toBe(0);
	});

	it("follows the pointer while dragging", () => {
		const t = setup({ index: 5 });
		t.wheel.pointerDown(100);
		t.wheel.pointerMove(100 - ITEM * 2);
		expect(t.wheel.dragging).toBe(true);
		expect(t.wheel.position).toBe(7);
		expect(t.changes).toEqual([7]);
	});

	it("snaps to the nearest item after a slow drag", () => {
		const t = setup({ index: 5 });
		drag(t, -ITEM * 1.3, 2000);
		t.wheel.pointerUp();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(6);
		expect(t.wheel.index).toBe(6);
	});

	it("projects a flick past where the finger let go", () => {
		const t = setup({ index: 0, count: 60, loop: true });
		drag(t, -ITEM * 2, 64);
		const released = t.wheel.position;
		t.wheel.pointerUp();
		t.scheduler.flush();
		expect(t.wheel.position).toBeGreaterThan(released + 2);
		expect(Number.isInteger(t.wheel.position)).toBe(true);
	});

	it("never jitters when coming to rest", () => {
		const t = setup({ index: 0, count: 60, loop: true });
		drag(t, -ITEM * 3, 64);
		t.wheel.pointerUp();
		const trace: number[] = [];
		t.wheel.subscribe(() => trace.push(t.wheel.position));
		t.scheduler.flush();
		for (let i = 1; i < trace.length; i++) {
			expect(trace[i]).toBeGreaterThanOrEqual(trace[i - 1]);
		}
	});

	it("caps very fast flicks", () => {
		const t = setup({ index: 0, count: 1000, loop: true });
		drag(t, -ITEM * 50, 32);
		t.wheel.pointerUp();
		t.scheduler.flush();
		// 50 dragged plus at most 40 items/s * 0.2s of projection.
		expect(t.wheel.position).toBeLessThanOrEqual(58);
	});

	it("stretches past the ends and springs back", () => {
		const t = setup({ index: 0 });
		t.wheel.pointerDown(0);
		t.wheel.pointerMove(ITEM * 4);
		expect(t.wheel.position).toBeLessThan(0);
		expect(t.wheel.position).toBeGreaterThan(-1.5);
		expect(t.wheel.index).toBe(0);
		t.scheduler.wait(500);
		t.wheel.pointerUp();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(0);
	});

	it("stops a flick at the last item when not looping", () => {
		const t = setup({ index: 8 });
		drag(t, -ITEM * 3, 48);
		t.wheel.pointerUp();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(11);
	});

	it("wraps the index when looping", () => {
		const t = setup({ index: 11, loop: true });
		drag(t, -ITEM * 2, 2000);
		t.wheel.pointerUp();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(13);
		expect(t.wheel.index).toBe(1);
		expect(t.changes).toEqual([0, 1]);
	});

	it("catches a moving wheel on pointer down", () => {
		const t = setup({ index: 0, count: 60, loop: true });
		drag(t, -ITEM * 3, 48);
		t.wheel.pointerUp();
		t.scheduler.advance(3);
		const caught = t.wheel.position;
		t.wheel.pointerDown(0);
		expect(t.wheel.position).toBe(caught);
		expect(t.wheel.velocity).toBe(0);
		expect(t.scheduler.pending()).toBe(false);
	});

	describe("tapping", () => {
		it("selects the row below the band", () => {
			const t = setup({ index: 3 });
			const below = t.wheel.slots()[7];
			t.wheel.pointerDown(0);
			t.wheel.pointerUp(below.y);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(5);
		});

		it("selects the row above the band", () => {
			const t = setup({ index: 3 });
			t.wheel.pointerDown(0);
			t.wheel.pointerUp(t.wheel.slots()[4].y);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(2);
		});

		it("ignores small wobbles during a tap", () => {
			const t = setup({ index: 3 });
			t.wheel.pointerDown(0);
			t.wheel.pointerMove(2);
			t.wheel.pointerUp(t.wheel.slots()[6].y);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(4);
		});

		it("does not tap after a real drag", () => {
			const t = setup({ index: 3 });
			drag(t, -ITEM, 2000);
			t.wheel.pointerUp(-80);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(4);
		});

		it("does not tap on cancel", () => {
			const t = setup({ index: 3 });
			t.wheel.pointerDown(0);
			t.wheel.pointerCancel();
			t.scheduler.flush();
			expect(t.wheel.index).toBe(3);
		});
	});

	it("treats a cancelled pointer like a release", () => {
		const t = setup({ index: 3 });
		drag(t, -ITEM * 0.8, 2000);
		t.wheel.pointerCancel();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(4);
		expect(t.wheel.dragging).toBe(false);
	});

	describe("keyboard", () => {
		it("steps one item with the arrow keys", () => {
			const t = setup({ index: 5 });
			expect(t.wheel.key("ArrowDown")).toBe(true);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(6);
			t.wheel.key("ArrowUp");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(5);
		});

		it("steps five items with page up and down", () => {
			const t = setup({ index: 5 });
			t.wheel.key("PageDown");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(10);
			t.wheel.key("PageUp");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(5);
		});

		it("adds up quick presses before the wheel settles", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.key("ArrowDown");
			t.scheduler.advance(2);
			t.wheel.key("ArrowDown");
			t.scheduler.advance(2);
			t.wheel.key("ArrowDown");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(3);
		});

		it("stops at the ends when not looping", () => {
			const t = setup({ index: 10 });
			t.wheel.key("PageDown");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(11);
		});

		it("wraps when looping", () => {
			const t = setup({ index: 0, loop: true });
			t.wheel.key("ArrowUp");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(11);
		});

		it("jumps to the ends with home and end", () => {
			const t = setup({ index: 5 });
			expect(t.wheel.key("End")).toBe(true);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(11);
			t.wheel.key("Home");
			t.scheduler.flush();
			expect(t.wheel.index).toBe(0);
		});

		it("leaves home and end alone when looping", () => {
			const t = setup({ index: 5, loop: true });
			expect(t.wheel.key("Home")).toBe(false);
			expect(t.wheel.key("End")).toBe(false);
		});

		it("ignores other keys", () => {
			const t = setup();
			expect(t.wheel.key("a")).toBe(false);
			expect(t.wheel.key("Tab")).toBe(false);
		});
	});

	describe("scrolling", () => {
		it("moves with pixel deltas and snaps once it goes quiet", () => {
			const t = setup({ index: 2, count: 60, loop: true });
			for (let i = 0; i < 5; i++) {
				expect(t.wheel.scroll(ITEM)).toBe(true);
				t.scheduler.advance(1, 16);
			}
			// 5 deltas of one item, scaled down to 0.6 each.
			expect(t.wheel.target).toBeCloseTo(5);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(5);
		});

		it("follows trackpad deltas exactly", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(30);
			expect(t.wheel.position).toBeCloseTo((30 / ITEM) * 0.6);
			expect(t.wheel.velocity).toBe(0);
		});

		it("never jumps when a trackpad flick mixes small and large deltas", () => {
			const t = setup({ index: 0, count: 1000, loop: true });
			const deltas = [10, 20, 40, 80, 120, 90, 60, 40, 25, 15, 8, 4, 2, 1];
			let before = t.wheel.position;
			for (const delta of deltas) {
				t.wheel.scroll(delta);
				t.scheduler.advance(1, 16);
				const moved = t.wheel.position - before;
				expect(moved).toBeCloseTo((delta / ITEM) * 0.6, 5);
				before = t.wheel.position;
			}
			const stopped = t.wheel.position;
			t.scheduler.flush();
			expect(Math.abs(t.wheel.position - stopped)).toBeLessThanOrEqual(0.5);
		});

		it("eases towards coarse mouse wheel notches", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(100);
			expect(t.wheel.position).toBe(0);
			t.scheduler.advance();
			expect(t.wheel.position).toBeGreaterThan(0);
		});

		it("stops within half an item of where a trackpad flick ends", () => {
			const t = setup({ index: 0, count: 1000, loop: true });
			// A flick, then the trackpad's own momentum dying away.
			let delta = 45;
			while (delta > 0.5) {
				t.wheel.scroll(delta);
				t.scheduler.advance(1, 16);
				delta *= 0.92;
			}
			const stopped = t.wheel.position;
			const trace: number[] = [];
			t.wheel.subscribe(() => trace.push(t.wheel.position));
			t.scheduler.flush();
			expect(Math.abs(t.wheel.position - stopped)).toBeLessThanOrEqual(0.5);
			expect(Math.max(...trace)).toBeLessThanOrEqual(
				Math.max(stopped, t.wheel.position),
			);
		});

		it("waits for the scroll to stop before snapping", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(ITEM * 0.5);
			t.scheduler.advance(5, 20);
			expect(t.wheel.target).toBeCloseTo(0.3);
			t.scheduler.advance(2, 20);
			expect(t.wheel.target).toBe(0);
		});

		it("treats line deltas as whole items", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(5, 1);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(3);
		});

		it("treats page deltas as several items", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(1, 2);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(3);
		});

		it("scrolls backwards with negative deltas", () => {
			const t = setup({ index: 0, loop: true });
			t.wheel.scroll(-ITEM * 4);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(10);
		});

		it("only overshoots the ends slightly", () => {
			const t = setup({ index: 10 });
			t.wheel.scroll(ITEM * 20);
			expect(t.wheel.target).toBeCloseTo(11.3);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(11);
		});

		it("is interrupted by a pointer press", () => {
			const t = setup({ index: 0, count: 60, loop: true });
			t.wheel.scroll(ITEM * 3);
			t.scheduler.advance(2);
			t.wheel.pointerDown(0);
			const held = t.wheel.position;
			t.scheduler.flush();
			expect(t.wheel.position).toBe(held);
		});
	});

	describe("sharing scroll with the page", () => {
		it("lets the page scroll when a bounded wheel is already at the end", () => {
			const t = setup({ index: 11 });
			expect(t.wheel.scroll(ITEM)).toBe(false);
			expect(t.wheel.target).toBe(11);
		});

		it("lets the page scroll when a bounded wheel is already at the start", () => {
			const t = setup({ index: 0 });
			expect(t.wheel.scroll(-ITEM)).toBe(false);
		});

		it("still scrolls inwards from an end", () => {
			const t = setup({ index: 0 });
			expect(t.wheel.scroll(ITEM)).toBe(true);
		});

		it("always uses the scroll when looping", () => {
			const t = setup({ index: 0, loop: true });
			expect(t.wheel.scroll(-ITEM)).toBe(true);
		});

		it("keeps a gesture that reaches the end on the wheel", () => {
			const t = setup({ index: 9 });
			for (let i = 0; i < 10; i++) {
				expect(t.wheel.scroll(ITEM)).toBe(true);
				t.scheduler.advance(1, 16);
			}
			t.scheduler.flush();
			expect(t.wheel.position).toBe(11);
		});

		it("keeps a gesture that went to the page on the page", () => {
			const t = setup({ index: 11 });
			expect(t.wheel.scroll(ITEM)).toBe(false);
			t.scheduler.wait(16);
			// Reversing mid-gesture doesn't grab it back.
			expect(t.wheel.scroll(-ITEM)).toBe(false);
			t.scheduler.wait(16);
			expect(t.wheel.scroll(-ITEM)).toBe(false);
		});

		it("starts a new gesture after a pause", () => {
			const t = setup({ index: 11 });
			expect(t.wheel.scroll(ITEM)).toBe(false);
			t.scheduler.wait(200);
			expect(t.wheel.scroll(-ITEM)).toBe(true);
		});
	});

	describe("setCount", () => {
		it("keeps the selected item when it still exists", () => {
			const t = setup({ index: 14, count: 31 });
			t.wheel.setCount(28);
			expect(t.wheel.index).toBe(14);
			expect(t.wheel.count).toBe(28);
			expect(t.scheduler.pending()).toBe(false);
		});

		it("animates to the last item when the selection disappears", () => {
			const t = setup({ index: 30, count: 31 });
			t.wheel.setCount(28);
			t.scheduler.advance();
			expect(t.wheel.position).toBeGreaterThan(27);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(27);
			expect(t.changes.at(-1)).toBe(27);
		});

		it("keeps the selected item when looping", () => {
			const t = setup({ index: 0, count: 31, loop: true });
			// Spin forwards past the end so the position is unwrapped.
			t.wheel.setIndex(40);
			expect(t.wheel.index).toBe(9);
			t.wheel.setCount(30);
			expect(t.wheel.index).toBe(9);
			expect(t.wheel.slots()[5].index).toBe(9);
		});

		it("moves straight to the last item when looping", () => {
			const t = setup({ index: 30, count: 31, loop: true });
			t.wheel.setCount(29);
			expect(t.wheel.index).toBe(28);
			expect(t.wheel.slots()[5].index).toBe(28);
			expect(t.scheduler.pending()).toBe(false);
		});

		it("keeps a looping wheel moving", () => {
			const t = setup({ index: 0, count: 31, loop: true });
			t.wheel.setIndex(5, { animate: true });
			t.scheduler.advance(2);
			t.wheel.setCount(28);
			t.scheduler.flush();
			expect(t.wheel.index).toBe(5);
		});

		it("lets a drag in progress carry on", () => {
			const t = setup({ index: 30, count: 31 });
			t.wheel.pointerDown(0);
			t.wheel.setCount(28);
			expect(t.wheel.dragging).toBe(true);
			t.scheduler.wait(500);
			t.wheel.pointerUp();
			t.scheduler.flush();
			expect(t.wheel.position).toBe(27);
		});

		it("pulls a moving target back when the wheel shrinks", () => {
			const t = setup({ index: 20, count: 31 });
			t.wheel.setIndex(30, { animate: true });
			t.scheduler.advance(2);
			expect(t.wheel.index).toBeLessThan(28);
			t.wheel.setCount(28);
			expect(t.wheel.target).toBe(27);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(27);
			expect(t.wheel.slots()[5]).toMatchObject({ index: 27, selected: true });
		});

		it("adds new items without moving", () => {
			const t = setup({ index: 27, count: 28 });
			t.wheel.setCount(31);
			expect(t.wheel.position).toBe(27);
			expect(t.wheel.slots()[8].index).toBe(30);
		});
	});

	describe("reduced motion", () => {
		it("jumps to the snapped item on release", () => {
			const t = setup({ index: 0, count: 60, loop: true, reducedMotion: true });
			drag(t, -ITEM * 2, 64);
			t.wheel.pointerUp();
			expect(Number.isInteger(t.wheel.position)).toBe(true);
			expect(t.wheel.position).toBeGreaterThan(2);
			expect(t.scheduler.pending()).toBe(false);
		});

		it("still follows the pointer while dragging", () => {
			const t = setup({ index: 5, reducedMotion: true });
			t.wheel.pointerDown(0);
			t.wheel.pointerMove(-ITEM * 0.5);
			expect(t.wheel.position).toBe(5.5);
		});

		it("jumps for keys, taps and notches", () => {
			const t = setup({ index: 5, reducedMotion: true });
			t.wheel.key("ArrowDown");
			expect(t.wheel.position).toBe(6);
			t.wheel.pointerDown(0);
			t.wheel.pointerUp(t.wheel.slots()[4].y);
			expect(t.wheel.position).toBe(5);
			t.wheel.scroll(3, 1);
			expect(t.wheel.position).toBeCloseTo(6.8);
		});

		it("animates setIndex instantly", () => {
			const t = setup({ reducedMotion: true });
			t.wheel.setIndex(9, { animate: true });
			expect(t.wheel.position).toBe(9);
		});

		it("can be switched on mid-animation", () => {
			const t = setup({ index: 0 });
			t.wheel.setIndex(9, { animate: true });
			t.scheduler.advance(2);
			t.wheel.setReducedMotion(true);
			expect(t.wheel.position).toBe(9);
			expect(t.wheel.velocity).toBe(0);
		});

		it("can be switched off again", () => {
			const t = setup({ index: 0, reducedMotion: true });
			t.wheel.setReducedMotion(false);
			t.wheel.setIndex(9, { animate: true });
			expect(t.wheel.position).toBe(0);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(9);
		});
	});

	describe("setIndex", () => {
		it("jumps without animating by default", () => {
			const t = setup();
			t.wheel.setIndex(7);
			expect(t.wheel.position).toBe(7);
			expect(t.scheduler.pending()).toBe(false);
		});

		it("animates when asked", () => {
			const t = setup();
			t.wheel.setIndex(7, { animate: true });
			t.scheduler.advance();
			expect(t.wheel.position).toBeGreaterThan(0);
			expect(t.wheel.position).toBeLessThan(7);
			t.scheduler.flush();
			expect(t.wheel.position).toBe(7);
		});

		it("takes the short way round when looping", () => {
			const t = setup({ index: 1, loop: true });
			t.wheel.setIndex(11, { animate: true });
			t.scheduler.flush();
			expect(t.wheel.position).toBe(-1);
			expect(t.wheel.index).toBe(11);
		});
	});

	describe("with no items", () => {
		it("has no selection and shows nothing", () => {
			for (const loop of [false, true]) {
				const { wheel } = setup({ count: 0, loop });
				expect(wheel.index).toBe(-1);
				expect(wheel.position).toBe(0);
				for (const slot of wheel.slots()) {
					expect(slot).toMatchObject({
						index: -1,
						visible: false,
						selected: false,
					});
				}
			}
		});

		it("ignores input", () => {
			const t = setup({ count: 0 });
			expect(t.wheel.key("ArrowDown")).toBe(false);
			expect(t.wheel.key("End")).toBe(false);
			expect(t.wheel.scroll(ITEM)).toBe(false);
			t.wheel.pointerDown(0);
			expect(t.wheel.dragging).toBe(false);
			t.wheel.setIndex(3, { animate: true });
			expect(t.scheduler.pending()).toBe(false);
			expect(t.wheel.position).toBe(0);
		});

		it("selects the first item once items arrive", () => {
			for (const loop of [false, true]) {
				const t = setup({ count: 0, loop });
				t.wheel.setCount(12);
				expect(t.wheel.index).toBe(0);
				expect(t.changes).toEqual([0]);
				expect(t.wheel.slots()[5]).toMatchObject({ index: 0, visible: true });
			}
		});

		it("stops moving when the items go away", () => {
			for (const loop of [false, true]) {
				const t = setup({ index: 3, loop });
				t.wheel.setIndex(8, { animate: true });
				t.scheduler.advance(2);
				t.wheel.setCount(0);
				expect(t.wheel.index).toBe(-1);
				expect(t.wheel.position).toBe(0);
				expect(t.scheduler.pending()).toBe(false);
			}
		});
	});

	it("keeps animating when a listener retargets on the last frame", () => {
		const t = setup({ index: 0, count: 60, loop: true });
		let retargeted = false;
		t.wheel.subscribe(() => {
			if (!retargeted && t.wheel.position === 3) {
				retargeted = true;
				t.wheel.setIndex(6, { animate: true });
			}
		});
		t.wheel.setIndex(3, { animate: true });
		t.scheduler.flush();
		expect(t.wheel.position).toBe(6);
	});

	it("stops notifying after destroy", () => {
		const t = setup();
		let calls = 0;
		t.wheel.subscribe(() => calls++);
		t.wheel.setIndex(4, { animate: true });
		t.wheel.destroy();
		t.scheduler.flush();
		expect(calls).toBe(0);
	});
});

describe("slots", () => {
	it("renders the selected item in the middle row", () => {
		const { wheel } = setup({ index: 4 });
		const slots = wheel.slots();
		expect(slots).toHaveLength(11);
		const middle = slots[5];
		expect(middle).toMatchObject({ index: 4, offset: 0, y: 0, selected: true });
		expect(middle.opacity).toBe(1);
		expect(slots.filter((slot) => slot.selected)).toHaveLength(1);
	});

	it("places rows around the cylinder", () => {
		const { wheel } = setup({ index: 4 });
		const [above, below] = [wheel.slots()[4], wheel.slots()[6]];
		const angle = (21 * Math.PI) / 180;
		expect(above.angle).toBeCloseTo(-angle);
		expect(above.y).toBeCloseTo(100 * Math.sin(-angle));
		expect(below.y).toBeCloseTo(-above.y);
		expect(below.opacity).toBeLessThan(1);
	});

	it("hides rows that have turned past the top and bottom", () => {
		const { wheel } = setup({ index: 6 });
		const slots = wheel.slots();
		// 5 rows * 21 degrees is past 90, 4 rows is not.
		expect(slots[0].visible).toBe(false);
		expect(slots[1].visible).toBe(true);
		expect(slots[10].visible).toBe(false);
	});

	it("hides rows past the ends of a non-looping wheel", () => {
		const { wheel } = setup({ index: 0 });
		const slots = wheel.slots();
		expect(slots[4]).toMatchObject({ index: -1, visible: false });
		expect(slots[6]).toMatchObject({ index: 1, visible: true });
	});

	it("wraps rows around when looping", () => {
		const { wheel } = setup({ index: 0, loop: true });
		const slots = wheel.slots();
		expect(slots[4]).toMatchObject({ index: 11, visible: true });
		expect(slots[3].index).toBe(10);
	});

	it("keeps row keys stable between positions", () => {
		const t = setup({ index: 3, loop: true });
		t.wheel.pointerDown(0);
		t.wheel.pointerMove(-ITEM * 0.4);
		expect(t.wheel.slots().map((slot) => slot.key)).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
		]);
		expect(t.wheel.slots()[5].offset).toBeCloseTo(-0.4);
	});
});
