import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Root } from "./root";
import { Wheel } from "./wheel";

const spoken = (html: string) =>
	[...html.matchAll(/aria-valuetext="([^"]*)"/g)].map((match) => match[1]);

function WrappedWithIndex() {
	return <Wheel index={2} />;
}

function WrappedWithoutIndex() {
	return <Wheel />;
}

describe("wheel positions", () => {
	const VALUE = ["a", "b", "c"];
	const render = (children: ReactNode) =>
		spoken(renderToString(<Root value={VALUE}>{children}</Root>));

	it("numbers wheels in order", () => {
		expect(
			render(
				<>
					<Wheel />
					<Wheel />
					<Wheel />
				</>,
			),
		).toEqual(["a", "b", "c"]);
	});

	it("skips separators and looks inside plain elements", () => {
		expect(
			render(
				<>
					<Wheel />
					<span>:</span>
					<div>
						<Wheel />
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
		expect(() => renderToString(<Wheel />)).toThrow(/inside Detent.Root/);
	});
});
