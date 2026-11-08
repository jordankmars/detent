// @vitest-environment jsdom
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Root } from "./root";
import { createHarness, selectedText, wheels } from "./test-utils";
import { Wheel } from "./wheel";

const LETTERS = ["a", "b", "c", "d", "e"];

function setup(initial: unknown[], items: readonly unknown[] = LETTERS) {
	const harness = createHarness();
	const onValueChange = vi.fn();
	const ui = (value: unknown[], list = items) => (
		<Root value={value} onValueChange={onValueChange}>
			<Wheel items={list} />
		</Root>
	);
	const view = render(ui(initial), { wrapper: harness.wrapper });
	return {
		harness,
		onValueChange,
		wheel: wheels(view.container)[0],
		update: (value: unknown[], list = items) => view.rerender(ui(value, list)),
	};
}

describe("following the value prop", () => {
	it("animates to a new value without echoing it", () => {
		const { harness, wheel, update, onValueChange } = setup(["a"]);
		update(["e"]);
		harness.advance(2);
		expect(selectedText(wheel)).not.toBe("e");
		harness.flush();
		expect(selectedText(wheel)).toBe("e");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("ignores a value that isn't in the list", () => {
		const { harness, wheel, update, onValueChange } = setup(["c"]);
		update(["zzz"]);
		harness.flush();
		expect(selectedText(wheel)).toBe("c");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("doesn't restart an animation for an equal list in a new array", () => {
		const measure = (rerenderMidway: boolean) => {
			const { harness, update } = setup(["a"]);
			update(["e"]);
			harness.advance(10);
			if (rerenderMidway) update(["e"], [...LETTERS]);
			let frames = 0;
			act(() => {
				frames = harness.scheduler.flush();
			});
			return frames;
		};
		expect(measure(true)).toBe(measure(false));
	});
});

describe("items changing", () => {
	it("moves the wheel to where the value went, without animating", () => {
		const { wheel, update, onValueChange } = setup(["c"]);
		update(["c"], ["c", "x", "y"]);
		expect(selectedText(wheel)).toBe("c");
		expect(wheel.getAttribute("aria-valuenow")).toBe("0");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("repaints labels when the count stays the same", () => {
		const { wheel, update } = setup(
			[1],
			[
				{ value: 1, label: "One" },
				{ value: 2, label: "Two" },
			],
		);
		update(
			[1],
			[
				{ value: 1, label: "Uno" },
				{ value: 2, label: "Dos" },
			],
		);
		expect(selectedText(wheel)).toBe("Uno");
		expect(wheel.getAttribute("aria-valuetext")).toBe("Uno");
	});

	it("reports the nearest item when the value disappears", () => {
		const days = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
		const { harness, wheel, update, onValueChange } = setup([31], days(31));
		update([31], days(28));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([28]);
		update([28], days(28));
		harness.flush();
		expect(selectedText(wheel)).toBe("28");
	});

	it("waits for items that arrive late without losing the value", () => {
		const { wheel, update, onValueChange } = setup(["d"], []);
		expect(wheel.hasAttribute("aria-valuenow")).toBe(false);
		update(["d"], LETTERS);
		expect(selectedText(wheel)).toBe("d");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("doesn't overwrite a value a partial list doesn't contain yet", () => {
		const { update, onValueChange } = setup(["z"], ["a", "b"]);
		update(["z"], ["a", "b", "c"]);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("stays on a repeated value instead of jumping to its first copy", () => {
		const list = ["a", "b", "a"];
		const { harness, wheel, update } = setup(["b"], list);
		fireEvent.keyDown(wheel, { key: "ArrowDown" });
		harness.flush();
		update(["a"], list);
		harness.flush();
		expect(wheel.getAttribute("aria-valuenow")).toBe("2");
	});
});
