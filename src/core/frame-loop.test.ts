import { describe, expect, it } from "vitest";
import { createFrameLoop, sharedFrameLoop } from "./frame-loop";
import { createManualScheduler } from "./testing";

describe("createFrameLoop", () => {
	it("only schedules frames while there is work", () => {
		const scheduler = createManualScheduler();
		const loop = createFrameLoop(scheduler);
		expect(scheduler.pending()).toBe(false);

		let runs = 0;
		loop.add(() => ++runs < 3);
		expect(scheduler.pending()).toBe(true);

		scheduler.flush();
		expect(runs).toBe(3);
		expect(scheduler.pending()).toBe(false);
	});

	it("passes elapsed seconds, capped for long frames", () => {
		const scheduler = createManualScheduler();
		const loop = createFrameLoop(scheduler);
		const seen: number[] = [];
		loop.add((dt) => {
			seen.push(dt);
			return seen.length < 2;
		});
		scheduler.advance(1, 16);
		scheduler.advance(1, 500);
		expect(seen[0]).toBeCloseTo(0.016);
		expect(seen[1]).toBeCloseTo(1 / 30);
	});

	it("runs several tasks in one frame", () => {
		const scheduler = createManualScheduler();
		const loop = createFrameLoop(scheduler);
		const order: string[] = [];
		loop.add(() => {
			order.push("a");
			return false;
		});
		loop.add(() => {
			order.push("b");
			return false;
		});
		scheduler.advance();
		expect(order).toEqual(["a", "b"]);
	});

	it("requests one frame when a task re-adds itself mid-frame", () => {
		const scheduler = createManualScheduler();
		const original = scheduler.request;
		let requests = 0;
		scheduler.request = (callback) => {
			requests++;
			return original(callback);
		};
		const loop = createFrameLoop(scheduler);
		let runs = 0;
		const task = () => {
			if (++runs === 1) {
				loop.remove(task);
				loop.add(task);
				return true;
			}
			return false;
		};
		loop.add(task);
		expect(requests).toBe(1);
		scheduler.advance();
		expect(requests).toBe(2);
		scheduler.flush();
		expect(runs).toBe(2);
	});

	it("cancels the frame when the last task is removed", () => {
		const scheduler = createManualScheduler();
		const loop = createFrameLoop(scheduler);
		const task = () => true;
		loop.add(task);
		expect(loop.has(task)).toBe(true);
		loop.remove(task);
		expect(loop.has(task)).toBe(false);
		expect(scheduler.pending()).toBe(false);
	});
});

describe("sharedFrameLoop", () => {
	it("returns one loop per scheduler", () => {
		const a = createManualScheduler();
		const b = createManualScheduler();
		expect(sharedFrameLoop(a)).toBe(sharedFrameLoop(a));
		expect(sharedFrameLoop(a)).not.toBe(sharedFrameLoop(b));
	});
});
