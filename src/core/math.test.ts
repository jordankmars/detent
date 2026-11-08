import { describe, expect, it } from "vitest";
import { clamp, rubberBand, wrap } from "./math";

describe("clamp", () => {
	it("keeps values inside the range", () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-3, 0, 10)).toBe(0);
		expect(clamp(12, 0, 10)).toBe(10);
	});
});

describe("wrap", () => {
	it("wraps in both directions", () => {
		expect(wrap(0, 12)).toBe(0);
		expect(wrap(12, 12)).toBe(0);
		expect(wrap(-1, 12)).toBe(11);
		expect(wrap(-25, 12)).toBe(11);
		expect(wrap(30, 12)).toBe(6);
	});
});

describe("rubberBand", () => {
	it("is zero with no overshoot", () => {
		expect(rubberBand(0, 1.5)).toBe(0);
	});

	it("moves less than the pointer", () => {
		expect(rubberBand(1, 1.5)).toBeLessThan(1);
		expect(rubberBand(1, 1.5)).toBeGreaterThan(0);
	});

	it("never reaches the limit", () => {
		expect(rubberBand(1e6, 1.5)).toBeLessThan(1.5);
		expect(rubberBand(1e6, 1.5)).toBeGreaterThan(1.49);
	});

	it("keeps growing as the overshoot grows", () => {
		expect(rubberBand(2, 1.5)).toBeGreaterThan(rubberBand(1, 1.5));
	});
});
