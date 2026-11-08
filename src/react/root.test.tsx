import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Root } from "./root";
import { Wheel } from "./wheel";

/** The value of each wheel: the one row marked as selected, in order. */
const spoken = (html: string) =>
	[...html.matchAll(/data-selected="" aria-hidden="true"[^>]*>([^<]*)</g)].map(
		(match) => match[1],
	);

const ITEMS = ["a", "b", "c"];

function WrappedWithIndex() {
	return <Wheel items={ITEMS} index={2} />;
}

function WrappedWithoutIndex() {
	return <Wheel items={ITEMS} />;
}

describe("wheel positions", () => {
	const VALUE = ["a", "b", "c"];
	const render = (children: ReactNode) =>
		spoken(renderToString(<Root value={VALUE}>{children}</Root>));

	it("numbers wheels in order", () => {
		expect(
			render(
				<>
					<Wheel items={ITEMS} />
					<Wheel items={ITEMS} />
					<Wheel items={ITEMS} />
				</>,
			),
		).toEqual(["a", "b", "c"]);
	});

	it("skips separators and looks inside plain elements", () => {
		expect(
			render(
				<>
					<Wheel items={ITEMS} />
					<span>:</span>
					<div>
						<Wheel items={ITEMS} />
					</div>
				</>,
			),
		).toEqual(["a", "b"]);
	});

	it("lets a wheel state its own position", () => {
		expect(render(<WrappedWithIndex />)).toEqual(["c"]);
	});

	it("explains how to fix a wrapped wheel with no position", () => {
		expect(() => render(<WrappedWithoutIndex />)).toThrow(/`index` prop/);
	});

	it("requires a Root", () => {
		expect(() => renderToString(<Wheel items={ITEMS} />)).toThrow(
			/inside Detent.Root/,
		);
	});
});
