import { describe, expect, it } from "vitest";
import { createVelocityTracker } from "./velocity";

describe("createVelocityTracker", () => {
	it("is zero with fewer than two samples", () => {
		const tracker = createVelocityTracker();
		expect(tracker.velocity()).toBe(0);
		tracker.add(5, 0);
		expect(tracker.velocity()).toBe(0);
	});

	it("measures units per second", () => {
		const tracker = createVelocityTracker();
		tracker.add(0, 0);
		tracker.add(1, 50);
		expect(tracker.velocity()).toBe(20);
	});

	it("only looks at the recent window", () => {
		const tracker = createVelocityTracker(90);
		tracker.add(0, 0);
		tracker.add(100, 16);
		// A long pause, then slow movement. The early fast part is dropped.
		tracker.add(100, 500);
		tracker.add(101, 516);
		tracker.add(102, 532);
		expect(tracker.velocity()).toBeCloseTo(62.5, 1);
	});

	it("is zero when samples share a timestamp", () => {
		const tracker = createVelocityTracker();
		tracker.add(0, 10);
		tracker.add(4, 10);
		expect(tracker.velocity()).toBe(0);
	});

	it("starts over after reset", () => {
		const tracker = createVelocityTracker();
		tracker.add(0, 0);
		tracker.add(10, 10);
		tracker.reset();
		expect(tracker.velocity()).toBe(0);
	});
});
