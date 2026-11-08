import { describe, expect, it } from "vitest";
import { type SpringConfig, stepSpring } from "./spring";

const config: SpringConfig = { duration: 0.55, bounce: 0, rest: 0.001 };

function run(x: number, v: number, target: number, frames: number, fps = 60) {
	let state = { x, v, done: false };
	const trace: number[] = [];
	for (let i = 0; i < frames && !state.done; i++) {
		state = stepSpring(state.x, state.v, target, config, 1 / fps);
		trace.push(state.x);
	}
	return { ...state, trace };
}

describe("stepSpring", () => {
	it("settles exactly on the target", () => {
		const end = run(0, 0, 10, 600);
		expect(end.done).toBe(true);
		expect(end.x).toBe(10);
		expect(end.v).toBe(0);
	});

	it("settles in about the configured duration", () => {
		const end = run(0, 0, 1, 600);
		const seconds = end.trace.length / 60;
		expect(seconds).toBeGreaterThan(0.4);
		expect(seconds).toBeLessThan(1.5);
	});

	it("does not overshoot with zero bounce and no initial velocity", () => {
		const end = run(0, 0, 5, 600);
		expect(Math.max(...end.trace)).toBeLessThanOrEqual(5);
	});

	it("carries initial velocity forward", () => {
		const still = stepSpring(0, 0, 0, config, 1 / 60);
		const moving = stepSpring(0, 20, 0, config, 1 / 60);
		expect(still.x).toBe(0);
		expect(moving.x).toBeGreaterThan(0);
	});

	it("gives the same result at different frame rates", () => {
		const at60 = run(0, 0, 3, 15, 60);
		const at120 = run(0, 0, 3, 30, 120);
		expect(at120.x).toBeCloseTo(at60.x, 3);
	});
});
