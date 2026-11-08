import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
	const query = window.matchMedia?.(QUERY);
	query?.addEventListener("change", onChange);
	return () => query?.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia?.(QUERY).matches ?? false;
const getServerSnapshot = () => false;

/** The user's `prefers-reduced-motion` setting, kept up to date. */
export function useReducedMotion() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
