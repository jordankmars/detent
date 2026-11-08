/** Reads the value a wheel reports for an item. */
export type GetValue<T> = (item: T) => unknown;
/** Reads the text shown and spoken for an item. */
export type GetLabel<T> = (item: T) => string;

/** A wheel's items reduced to what the adapter needs: values and text. */
export interface ItemModel {
	readonly source: readonly unknown[];
	readonly getValue: GetValue<never>;
	readonly getLabel: GetLabel<never>;
	readonly values: readonly unknown[];
	readonly labels: readonly string[];
	/** Index of the first item with this value, or -1. */
	indexOf(value: unknown): number;
}

function isRecord(item: unknown): item is Record<string, unknown> {
	return typeof item === "object" && item !== null;
}

export function defaultGetValue(item: unknown): unknown {
	return isRecord(item) && "value" in item ? item.value : item;
}

export function defaultGetLabel(item: unknown): string {
	if (isRecord(item) && typeof item.label === "string") return item.label;
	return String(defaultGetValue(item));
}

function sameList(a: readonly unknown[], b: readonly unknown[]) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!Object.is(a[i], b[i])) return false;
	}
	return true;
}

/**
 * Builds the model for a list of items, returning `previous` when nothing
 * visible changed. An inline `items={["AM", "PM"]}` is a new array every
 * render, and treating that as a change would interrupt a running animation.
 */
export function reconcileItems<T>(
	previous: ItemModel | null,
	items: readonly T[],
	getValue: GetValue<T> = defaultGetValue,
	getLabel: GetLabel<T> = defaultGetLabel,
): ItemModel {
	if (
		previous &&
		previous.source === items &&
		previous.getValue === getValue &&
		previous.getLabel === getLabel
	) {
		return previous;
	}

	const values = items.map(getValue);
	const labels = items.map(getLabel);
	if (
		previous &&
		sameList(previous.values, values) &&
		sameList(previous.labels, labels)
	) {
		return previous;
	}

	let positions: Map<unknown, number> | null = null;
	return {
		source: items,
		getValue: getValue as GetValue<never>,
		getLabel: getLabel as GetLabel<never>,
		values,
		labels,
		indexOf(value) {
			// Built on first use, since most lists are never searched.
			if (!positions) {
				positions = new Map();
				for (let i = values.length - 1; i >= 0; i--)
					positions.set(values[i], i);
			}
			return positions.get(value) ?? -1;
		},
	};
}
