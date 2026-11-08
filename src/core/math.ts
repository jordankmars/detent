export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Positive modulo, so -1 wraps to n - 1 instead of staying negative. */
export function wrap(index: number, length: number): number {
	return ((index % length) + length) % length;
}

/**
 * Distance travelled when dragged `overshoot` past an edge. Motion keeps
 * following the pointer but slows down, approaching `limit` without ever
 * reaching it.
 */
export function rubberBand(overshoot: number, limit: number): number {
	return limit * (1 - 1 / ((overshoot * 0.55) / limit + 1));
}
