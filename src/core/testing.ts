import type { Scheduler } from "./frame-loop";

export interface ManualScheduler extends Scheduler {
	/** Run pending frames, advancing the clock by `ms` each time. */
	advance(frames?: number, ms?: number): void;
	/** Move the clock without running a frame. Fires any timeouts that come due. */
	wait(ms: number): void;
	/**
	 * Run frames until nothing is scheduled, up to a safety limit. When only
	 * timeouts are left, skips ahead to the next one.
	 */
	flush(ms?: number): number;
	pending(): boolean;
}

/** A clock and frame scheduler for tests, driven one frame at a time. */
export function createManualScheduler(): ManualScheduler {
	let time = 0;
	let nextId = 1;
	const callbacks = new Map<number, (time: number) => void>();
	const timeouts = new Map<number, { at: number; callback: () => void }>();

	const fireTimeouts = () => {
		const due = [...timeouts]
			.filter(([, timeout]) => timeout.at <= time)
			.sort(([, a], [, b]) => a.at - b.at);
		for (const [id, timeout] of due) {
			if (!timeouts.delete(id)) continue;
			timeout.callback();
		}
	};

	const runFrame = (ms: number) => {
		time += ms;
		fireTimeouts();
		const due = [...callbacks];
		callbacks.clear();
		for (const [, callback] of due) callback(time);
	};

	return {
		now: () => time,
		request(callback) {
			const id = nextId++;
			callbacks.set(id, callback);
			return id;
		},
		cancel(id) {
			callbacks.delete(id);
		},
		setTimeout(callback, ms) {
			const id = nextId++;
			timeouts.set(id, { at: time + ms, callback });
			return id;
		},
		clearTimeout(id) {
			timeouts.delete(id);
		},
		advance(frames = 1, ms = 1000 / 60) {
			for (let i = 0; i < frames; i++) runFrame(ms);
		},
		wait(ms) {
			time += ms;
			fireTimeouts();
		},
		flush(ms = 1000 / 60) {
			let frames = 0;
			while ((callbacks.size || timeouts.size) && frames < 10_000) {
				if (callbacks.size) {
					runFrame(ms);
				} else {
					const next = Math.min(...[...timeouts.values()].map((t) => t.at));
					time = Math.max(time, next);
					fireTimeouts();
				}
				frames++;
			}
			return frames;
		},
		pending: () => callbacks.size > 0 || timeouts.size > 0,
	};
}
