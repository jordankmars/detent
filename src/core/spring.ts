export interface SpringConfig {
	/** Rough time in seconds to settle, ignoring bounce. */
	duration: number;
	/** 0 is critically damped, values towards 1 overshoot more. */
	bounce: number;
	/** Distance from the target (and a tenth of the speed) treated as settled. */
	rest: number;
}

export interface SpringStep {
	x: number;
	v: number;
	done: boolean;
}

/** Integration steps per second. High enough to stay stable at any bounce. */
const STEPS_PER_SECOND = 600;

export function springCoefficients(duration: number, bounce: number) {
	return {
		stiffness: ((2 * Math.PI) / duration) ** 2,
		damping: (4 * Math.PI * (1 - bounce)) / duration,
	};
}

/**
 * Advances a spring from `x` with velocity `v` towards `target` over `dt`
 * seconds. Splits the frame into small fixed steps so the result doesn't
 * depend on frame rate.
 */
export function stepSpring(
	x: number,
	v: number,
	target: number,
	config: SpringConfig,
	dt: number,
): SpringStep {
	const { stiffness, damping } = springCoefficients(
		config.duration,
		config.bounce,
	);
	const steps = Math.max(1, Math.ceil(dt * STEPS_PER_SECOND));
	const h = dt / steps;

	for (let i = 0; i < steps; i++) {
		v += (-stiffness * (x - target) - damping * v) * h;
		x += v * h;
	}

	if (Math.abs(x - target) < config.rest && Math.abs(v) < config.rest * 10) {
		return { x: target, v: 0, done: true };
	}
	return { x, v, done: false };
}
