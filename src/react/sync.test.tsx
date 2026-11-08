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

describe("reporting user changes", () => {
	const ITEM = 36;
	const press = (wheel: Element, y = 100, pointerId = 1) =>
		fireEvent.pointerDown(wheel, { clientY: y, pointerId, button: 0 });
	const move = (wheel: Element, y: number, pointerId = 1) =>
		fireEvent.pointerMove(wheel, { clientY: y, pointerId });

	it("reports each item crossed", () => {
		const { wheel, onValueChange } = setup(["a"]);
		press(wheel);
		move(wheel, 100 - ITEM);
		move(wheel, 100 - ITEM * 2);
		expect(onValueChange.mock.calls).toEqual([[["b"]], [["c"]]]);
	});

	it("updates itself when uncontrolled", () => {
		const harness = createHarness();
		const { container } = render(
			<Root defaultValue={["a"]}>
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		const wheel = wheels(container)[0];
		fireEvent.keyDown(wheel, { key: "ArrowDown" });
		harness.flush();
		expect(selectedText(wheel)).toBe("b");
	});

	it("reports complete arrays even with no starting value", () => {
		const harness = createHarness();
		const onValueChange = vi.fn();
		const { container } = render(
			<Root onValueChange={onValueChange}>
				<Wheel items={LETTERS} />
				<Wheel items={["x", "y"]} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		press(wheels(container)[1]);
		move(wheels(container)[1], 100 - ITEM);
		expect(onValueChange).toHaveBeenLastCalledWith(["a", "y"]);
	});

	it("keeps two wheels moving at once from overwriting each other", () => {
		const harness = createHarness();
		const onValueChange = vi.fn();
		const { container } = render(
			// The value never updates, as if React hadn't caught up yet.
			<Root value={["a", "a"]} onValueChange={onValueChange}>
				<Wheel items={LETTERS} />
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		const [first, second] = wheels(container);
		press(first, 100, 1);
		press(second, 100, 2);
		move(first, 100 - ITEM, 1);
		move(second, 100 - ITEM, 2);
		expect(onValueChange).toHaveBeenLastCalledWith(["b", "b"]);
	});

	it("ignores value changes while being dragged", () => {
		const { wheel, update } = setup(["a"]);
		press(wheel);
		move(wheel, 100 - ITEM);
		update(["e"]);
		expect(selectedText(wheel)).toBe("b");
	});

	it("isn't pulled back by a value that lags behind a flick", () => {
		const { harness, wheel, update, onValueChange } = setup(["a"]);
		fireEvent.keyDown(wheel, { key: "End" });
		harness.advance(12);
		const reported = onValueChange.mock.calls.map(([value]) => value[0]);
		expect(reported.length).toBeGreaterThan(1);
		// React delivers an older value while the wheel has moved on.
		update([reported[0]]);
		harness.flush();
		expect(selectedText(wheel)).toBe("e");
	});

	it("reports where the wheel is when grabbed mid-animation", () => {
		const { harness, wheel, update, onValueChange } = setup(["a"]);
		update(["e"]);
		harness.advance(10);
		const passing = selectedText(wheel);
		expect(passing).not.toBe("e");
		press(wheel);
		expect(onValueChange).toHaveBeenLastCalledWith([passing]);
	});

	it("doesn't take over an animation for keys it doesn't use", () => {
		const { harness, wheel, update, onValueChange } = setup(["a"]);
		update(["e"]);
		harness.advance(4);
		fireEvent.keyDown(wheel, { key: "Tab" });
		harness.flush();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("keeps every wheel running when a callback throws", () => {
		const reportError = vi.fn();
		vi.stubGlobal("reportError", reportError);
		const harness = createHarness();
		const { container } = render(
			<Root
				defaultValue={["a", "a"]}
				onValueChange={() => {
					throw new Error("boom");
				}}
			>
				<Wheel items={LETTERS} />
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		const [first, second] = wheels(container);
		fireEvent.keyDown(first, { key: "ArrowDown" });
		fireEvent.keyDown(second, { key: "ArrowDown" });
		harness.flush();
		expect(reportError).toHaveBeenCalled();
		expect(selectedText(first)).toBe("b");
		expect(selectedText(second)).toBe("b");
		vi.unstubAllGlobals();
	});
});
