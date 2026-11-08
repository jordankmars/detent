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

	it("treats a cancelled pointer like a release", () => {
		const t = setup({ index: 3 });
		drag(t, -ITEM * 0.8, 2000);
		t.wheel.pointerCancel();
		t.scheduler.flush();
		expect(t.wheel.position).toBe(4);
		expect(t.wheel.dragging).toBe(false);
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
