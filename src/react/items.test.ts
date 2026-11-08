import { describe, expect, it } from "vitest";
import { reconcileItems } from "./items";

describe("reconcileItems", () => {
	it("uses primitives as both value and label", () => {
		const model = reconcileItems(null, [1, 2]);
		expect(model.values).toEqual([1, 2]);
		expect(model.labels).toEqual(["1", "2"]);
	});

	it("reads value and label from objects", () => {
		const model = reconcileItems(null, [
			{ value: "us", label: "United States" },
			{ value: "ca" },
		]);
		expect(model.values).toEqual(["us", "ca"]);
		expect(model.labels).toEqual(["United States", "ca"]);
	});

	it("accepts custom readers for arbitrary items", () => {
		const model = reconcileItems(
			null,
			[{ code: "fr", name: "France" }],
			(item) => item.code,
			(item) => item.name,
		);
		expect(model.values).toEqual(["fr"]);
		expect(model.labels).toEqual(["France"]);
	});

	it("finds the first item with a value", () => {
		const model = reconcileItems(null, ["a", "b", "a"]);
		expect(model.indexOf("a")).toBe(0);
		expect(model.indexOf("b")).toBe(1);
		expect(model.indexOf("z")).toBe(-1);
	});

	it("keeps the same model for an equal list in a new array", () => {
		const first = reconcileItems(null, ["AM", "PM"]);
		expect(reconcileItems(first, ["AM", "PM"])).toBe(first);
	});

	it("makes a new model when the values or labels differ", () => {
		const first = reconcileItems(null, [{ value: 1, label: "One" }]);
		expect(reconcileItems(first, [{ value: 2, label: "One" }])).not.toBe(first);
		expect(reconcileItems(first, [{ value: 1, label: "Uno" }])).not.toBe(first);
	});
});
