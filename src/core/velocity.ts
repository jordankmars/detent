export interface VelocityTracker {
	/** Record a position at time `t` in milliseconds. */
	add(x: number, t: number): void;
	/** Units per second across the recent window. */
	velocity(): number;
	reset(): void;
}

/**
 * Measures release velocity from the last `windowMs` of samples. Looking at a
 * short window, instead of only the last two points, keeps one jittery
 * pointer event from deciding the whole flick.
 */
export function createVelocityTracker(windowMs = 90): VelocityTracker {
	const samples: Array<[x: number, t: number]> = [];

	return {
		add(x, t) {
			samples.push([x, t]);
			while (samples.length > 2 && t - samples[0][1] > windowMs) {
				samples.shift();
			}
		},
		velocity() {
			if (samples.length < 2) return 0;
			const [x0, t0] = samples[0];
			const [x1, t1] = samples[samples.length - 1];
			return t1 > t0 ? (x1 - x0) / ((t1 - t0) / 1000) : 0;
		},
		reset() {
			samples.length = 0;
		},
	};
}
