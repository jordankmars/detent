import { createContext, type RefObject } from "react";
import type { Scheduler, Wheel } from "../core";

export interface RootContextValue {
	/** The current value of every wheel, by position. */
	value: readonly unknown[];
	/** Newest known values, ahead of `value` while React catches up. */
	latest: RefObject<unknown[]>;
	/** Every mounted engine, so a wheel can tell if its siblings are moving. */
	engines: Set<Wheel>;
	itemHeight: number;
	disabled: boolean;
	reducedMotion: boolean;
	change(next: unknown[]): void;
	commit(next: unknown[]): void;
}

export const RootContext = createContext<RootContextValue | null>(null);

/** A wheel's position in the Root's value, assigned by the Root. */
export const SlotContext = createContext<number | undefined>(undefined);

export interface InternalContextValue {
	/** Clock and frame source, replaced in tests. */
	scheduler?: Scheduler;
	/** Told about each engine, so the playground can read its state. */
	register?: (engine: Wheel, element: HTMLElement) => () => void;
}

/** For this repo's tests and playground. Not part of the public API. */
export const InternalContext = createContext<InternalContextValue>({});

/**
 * Runs a consumer callback. These are called from the frame loop that every
 * wheel on the page shares, so one that throws must not stop the others.
 */
export function safely(callback: () => void) {
	try {
		callback();
	} catch (error) {
		if (typeof reportError === "function") reportError(error);
		else console.error(error);
	}
}
