export interface Scheduler {
	/** Current time in milliseconds. */
	now(): number;
	request(callback: (time: number) => void): number;
	cancel(id: number): void;
}

/** Called once per frame with the elapsed seconds. Return false when done. */
export type FrameTask = (dt: number) => boolean;

export interface FrameLoop {
	add(task: FrameTask): void;
	remove(task: FrameTask): void;
	has(task: FrameTask): boolean;
}

/** Longest frame we'll simulate in one go, so a background tab doesn't jump. */
const MAX_DT = 1 / 30;

// Read lazily so importing the core during SSR doesn't touch `window`.
export const browserScheduler: Scheduler = {
	now: () => performance.now(),
	request: (callback) => requestAnimationFrame(callback),
	cancel: (id) => cancelAnimationFrame(id),
};

export function createFrameLoop(scheduler: Scheduler): FrameLoop {
	const tasks = new Set<FrameTask>();
	let frame = 0;
	let last = 0;

	function tick(now: number) {
		const dt = Math.max(0, Math.min((now - last) / 1000, MAX_DT));
		last = now;
		for (const task of [...tasks]) {
			if (!task(dt)) tasks.delete(task);
		}
		frame = tasks.size ? scheduler.request(tick) : 0;
	}

	return {
		add(task) {
			tasks.add(task);
			if (!frame) {
				last = scheduler.now();
				frame = scheduler.request(tick);
			}
		},
		remove(task) {
			tasks.delete(task);
			if (!tasks.size && frame) {
				scheduler.cancel(frame);
				frame = 0;
			}
		},
		has(task) {
			return tasks.has(task);
		},
	};
}

const loops = new WeakMap<Scheduler, FrameLoop>();

/**
 * Every wheel using the same scheduler shares one loop, so three wheels
 * animating together cost one requestAnimationFrame, not three.
 */
export function sharedFrameLoop(scheduler: Scheduler): FrameLoop {
	let loop = loops.get(scheduler);
	if (!loop) {
		loop = createFrameLoop(scheduler);
		loops.set(scheduler, loop);
	}
	return loop;
}
