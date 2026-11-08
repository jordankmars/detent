// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { StrictMode } from "react";
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
