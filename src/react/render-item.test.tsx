// @vitest-environment jsdom
import { act, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Root } from "./root";
import { createHarness, selectedText, wheels } from "./test-utils";
import { Wheel } from "./wheel";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	value: i,
	label: `Item ${i}`,
}));
const ITEM_HEIGHT = 36;

type Item = (typeof ITEMS)[number];

function mount(renderItem: (item: Item, index: number) => React.ReactNode) {
	const harness = createHarness();
	const { container } = render(
		<Root defaultValue={[10]}>
			<Wheel items={ITEMS} renderItem={renderItem} />
		</Root>,
		{ wrapper: harness.wrapper },
	);
	return { harness, wheel: wheels(container)[0] };
}

const press = (wheel: Element) =>
	fireEvent.pointerDown(wheel, { clientY: 500, pointerId: 1, button: 0 });
const move = (wheel: Element, items: number) =>
	fireEvent.pointerMove(wheel, {
		clientY: 500 - items * ITEM_HEIGHT,
		pointerId: 1,
	});

describe("renderItem", () => {
	const renderName = (item: Item) => <b>{item.value}</b>;

	it("renders custom content in the rows", () => {
		const { wheel } = mount(renderName);
		expect(wheel.querySelector("[data-selected] b")?.textContent).toBe("10");
	});

	it("still speaks the label", () => {
		const { wheel } = mount(renderName);
		expect(wheel.getAttribute("aria-valuetext")).toBe("Item 10");
	});

	it("shows the right item after moving", () => {
		const { wheel } = mount(renderName);
		press(wheel);
		move(wheel, 7);
		expect(selectedText(wheel)).toBe("17");
	});

	it("renders one new row per item crossed", () => {
		const renderItem = vi.fn(renderName);
		const { wheel } = mount(renderItem);
		press(wheel);
		renderItem.mockClear();
		move(wheel, 1);
		expect(renderItem).toHaveBeenCalledTimes(1);
	});

	it("doesn't paint a far jump until React has the new rows", () => {
		const { wheel } = mount(renderName);
		press(wheel);
		act(() => {
			move(wheel, 8);
			// Nested in `act`, so React hasn't committed anything yet.
			expect(selectedText(wheel)).toBe("10");
		});
		expect(selectedText(wheel)).toBe("18");
	});

	it("doesn't carry a row's state over to a different item", () => {
		const { wheel } = mount((item) => <Counter label={item.value} />);
		const row = () => wheel.querySelector("[data-selected] button");
		fireEvent.click(row() as Element);
		expect(row()?.textContent).toBe("10:1");
		press(wheel);
		move(wheel, 11);
		move(wheel, 0);
		expect(row()?.textContent).toBe("10:0");
	});
});

function Counter({ label }: { label: number }) {
	const [count, setCount] = useState(0);
	return (
		<button type="button" onClick={() => setCount(count + 1)}>
			{label}:{count}
		</button>
	);
}

describe("text rows", () => {
	it("reuses the same row elements while moving", () => {
		const harness = createHarness();
		const { container } = render(
			<Root defaultValue={[10]}>
				<Wheel items={ITEMS} />
			</Root>,
			{ wrapper: harness.wrapper },
		);
		const wheel = wheels(container)[0];
		const rows = [...wheel.querySelectorAll("[data-tambour-item]")];
		press(wheel);
		move(wheel, 3);
		expect([...wheel.querySelectorAll("[data-tambour-item]")]).toEqual(rows);
		expect(selectedText(wheel)).toBe("Item 13");
	});

	it("switches between text and custom rows", () => {
		const harness = createHarness();
		const ui = (custom: boolean) => (
			<Root value={[10]}>
				<Wheel
					items={ITEMS}
					renderItem={custom ? (item) => <b>{item.value}</b> : undefined}
				/>
			</Root>
		);
		const view = render(ui(false), { wrapper: harness.wrapper });
		const wheel = wheels(view.container)[0];
		view.rerender(ui(true));
		expect(selectedText(wheel)).toBe("10");
		view.rerender(ui(false));
		expect(selectedText(wheel)).toBe("Item 10");
	});
});
