// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { type KeyboardEvent, StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { Root } from "./root";
import { createHarness, selectedText, wheels } from "./test-utils";
import { Wheel } from "./wheel";

const LETTERS = ["a", "b", "c", "d", "e"];

describe("rendering", () => {
	it("shows the item matching the value", () => {
		const harness = createHarness();
		const { container } = render(
			<Root value={["c"]}>
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		expect(selectedText(wheels(container)[0])).toBe("c");
	});

	it("starts on the first item without a value", () => {
		const harness = createHarness();
		const { container } = render(
			<Root>
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		expect(selectedText(wheels(container)[0])).toBe("a");
	});

	it("only ever renders eleven rows", () => {
		const harness = createHarness();
		const items = Array.from({ length: 10_000 }, (_, i) => i);
		const { container } = render(
			<Root value={[5000]}>
				<Wheel items={items} loop />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		expect(container.querySelectorAll("[data-detent-item]")).toHaveLength(11);
	});

	it("hides rows past the ends of a bounded wheel", () => {
		const harness = createHarness();
		const { container } = render(
			<Root value={["a"]}>
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		const visible = [
			...container.querySelectorAll<HTMLElement>("[data-detent-item]"),
		].filter((row) => row.style.visibility !== "hidden");
		expect(visible.map((row) => row.textContent)).toEqual(LETTERS);
	});

	it("survives StrictMode's double mount", () => {
		const harness = createHarness();
		const { container } = render(
			<StrictMode>
				<Root value={["b"]}>
					<Wheel items={LETTERS} />
				</Root>
			</StrictMode>,
			{ wrapper: harness.wrapper },
		);
		expect(selectedText(wheels(container)[0])).toBe("b");
	});

	it("forwards a ref and props to the element", () => {
		const harness = createHarness();
		let element: HTMLDivElement | null = null;
		const { container } = render(
			<Root value={["b"]}>
				<Wheel
					items={LETTERS}
					className="mine"
					ref={(node) => {
						element = node;
					}}
				/>
			</Root>,
			{ wrapper: harness.wrapper },
		);
		expect(element).toBe(wheels(container)[0]);
		expect(wheels(container)[0].className).toBe("mine");
	});
});

function mount(items = LETTERS, value = "c", props = {}) {
	const harness = createHarness();
	const { container } = render(
		<Root defaultValue={[value]}>
			<Wheel items={items} aria-label="Letter" {...props} />
		</Root>,
		{ wrapper: harness.wrapper },
	);
	return { harness, wheel: wheels(container)[0] };
}

describe("input", () => {
	const ITEM = 36;

	it("follows a drag and settles on the nearest item", () => {
		const { harness, wheel } = mount();
		fireEvent.pointerDown(wheel, { clientY: 100, pointerId: 1, button: 0 });
		fireEvent.pointerMove(wheel, { clientY: 100 - ITEM, pointerId: 1 });
		expect(selectedText(wheel)).toBe("d");
		fireEvent.pointerUp(wheel, { clientY: 100 - ITEM, pointerId: 1 });
		harness.flush();
		expect(selectedText(wheel)).toBe("d");
	});

	it("selects the tapped row", () => {
		const { harness, wheel } = mount();
		fireEvent.pointerDown(wheel, { clientY: ITEM, pointerId: 1, button: 0 });
		fireEvent.pointerUp(wheel, { clientY: ITEM, pointerId: 1 });
		harness.flush();
		expect(selectedText(wheel)).toBe("d");
	});

	it("ignores buttons other than the primary one", () => {
		const { wheel } = mount();
		fireEvent.pointerDown(wheel, { clientY: 100, pointerId: 1, button: 2 });
		fireEvent.pointerMove(wheel, { clientY: 100 - ITEM, pointerId: 1 });
		expect(selectedText(wheel)).toBe("c");
	});

	it("ignores a second finger", () => {
		const { wheel } = mount();
		fireEvent.pointerDown(wheel, { clientY: 100, pointerId: 1, button: 0 });
		fireEvent.pointerDown(wheel, { clientY: 300, pointerId: 2, button: 0 });
		fireEvent.pointerMove(wheel, { clientY: 300 - ITEM, pointerId: 2 });
		expect(selectedText(wheel)).toBe("c");
		fireEvent.pointerMove(wheel, { clientY: 100 - ITEM, pointerId: 1 });
		expect(selectedText(wheel)).toBe("d");
	});

	it("steps with the keyboard and prevents the default", () => {
		const { harness, wheel } = mount();
		expect(fireEvent.keyDown(wheel, { key: "ArrowDown" })).toBe(false);
		harness.flush();
		expect(selectedText(wheel)).toBe("d");
		expect(fireEvent.keyDown(wheel, { key: "a" })).toBe(true);
	});

	it("uses a scroll inside the list but leaves one at the end to the page", () => {
		const { wheel } = mount();
		expect(fireEvent.wheel(wheel, { deltaY: 10 })).toBe(false);

		const atEnd = mount(LETTERS, "e").wheel;
		expect(fireEvent.wheel(atEnd, { deltaY: 10 })).toBe(true);
	});

	it("lets a consumer handler opt out", () => {
		const { wheel } = mount(LETTERS, "c", {
			onKeyDown: (event: KeyboardEvent) => event.preventDefault(),
		});
		fireEvent.keyDown(wheel, { key: "ArrowDown" });
		expect(wheel.getAttribute("aria-valuetext")).toBe("c");
	});
});

describe("disabled", () => {
	it("ignores input and leaves scrolling to the page", () => {
		const { wheel } = mount(LETTERS, "c", { disabled: true });
		fireEvent.pointerDown(wheel, { clientY: 100, pointerId: 1, button: 0 });
		fireEvent.pointerMove(wheel, { clientY: 0, pointerId: 1 });
		expect(selectedText(wheel)).toBe("c");
		expect(fireEvent.keyDown(wheel, { key: "ArrowDown" })).toBe(true);
		expect(fireEvent.wheel(wheel, { deltaY: 10 })).toBe(true);
	});

	it("is exposed to assistive technology and leaves the tab order", () => {
		const { wheel } = mount(LETTERS, "c", { disabled: true });
		expect(wheel.getAttribute("aria-disabled")).toBe("true");
		expect(wheel.tabIndex).toBe(-1);
		expect(wheel.hasAttribute("data-disabled")).toBe(true);
	});

	it("follows the Root", () => {
		const harness = createHarness();
		const { container } = render(
			<Root value={["c"]} disabled>
				<Wheel items={LETTERS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		expect(wheels(container)[0].tabIndex).toBe(-1);
	});
});

describe("accessibility", () => {
	it("is a labelled spinbutton with a spoken value", () => {
		const { wheel } = mount(
			[
				{ value: 1, label: "One" },
				{ value: 2, label: "Two" },
			] as never,
			2 as never,
		);
		expect(wheel.getAttribute("role")).toBe("spinbutton");
		expect(wheel.getAttribute("aria-label")).toBe("Letter");
		expect(wheel.getAttribute("aria-valuemin")).toBe("0");
		expect(wheel.getAttribute("aria-valuemax")).toBe("1");
		expect(wheel.getAttribute("aria-valuenow")).toBe("1");
		expect(wheel.getAttribute("aria-valuetext")).toBe("Two");
	});

	it("updates the spoken value as the wheel moves", () => {
		const { harness, wheel } = mount();
		fireEvent.keyDown(wheel, { key: "ArrowDown" });
		harness.flush();
		expect(wheel.getAttribute("aria-valuetext")).toBe("d");
		expect(wheel.getAttribute("aria-valuenow")).toBe("3");
	});

	it("hides rows from assistive technology", () => {
		const { wheel } = mount();
		for (const row of wheel.querySelectorAll("[data-detent-item]")) {
			expect(row.getAttribute("aria-hidden")).toBe("true");
		}
	});
});
