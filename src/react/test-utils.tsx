import { act, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, vi } from "vitest";
import { createManualScheduler } from "../core/testing";
import { InternalContext } from "./context";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Element.prototype.setPointerCapture = vi.fn();

afterEach(cleanup);

/** A manual clock, and a wrapper that hands it to every wheel. */
export function createHarness() {
	const scheduler = createManualScheduler();
	const internal = { scheduler };
	return {
		scheduler,
		wrapper: ({ children }: { children: ReactNode }) => (
			<InternalContext.Provider value={internal}>
				{children}
			</InternalContext.Provider>
		),
		advance(frames = 1) {
			act(() => scheduler.advance(frames));
		},
		flush() {
			act(() => {
				scheduler.flush();
			});
		},
	};
}

/** The text of the row in the center band. */
export function selectedText(wheel: Element) {
	return wheel.querySelector("[data-selected]")?.textContent;
}

export function wheels(container: Element) {
	return [
		...container.querySelectorAll("[data-detent-wheel]"),
	] as HTMLElement[];
}
