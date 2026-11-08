import type { Scheduler } from "./frame-loop";

export interface ManualScheduler extends Scheduler {
	/** Run pending frames, advancing the clock by `ms` each time. */
	advance(frames?: number, ms?: number): void;
	/** Move the clock without running a frame. */
	wait(ms: number): void;
	/** Run frames until nothing is scheduled, up to a safety limit. */
	flush(ms?: number): number;
	pending(): boolean;
}

/** A clock and frame scheduler for tests, driven one frame at a time. */
export function createManualScheduler(): ManualScheduler {
	let time = 0;
	let nextId = 1;
	const callbacks = new Map<number, (time: number) => void>();

	const runFrame = (ms: number) => {
		time += ms;
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
		advance(frames = 1, ms = 1000 / 60) {
			for (let i = 0; i < frames; i++) runFrame(ms);
		},
		wait(ms) {
			time += ms;
		},
		flush(ms = 1000 / 60) {
			let frames = 0;
			while (callbacks.size && frames < 10_000) {
				runFrame(ms);
				frames++;
			}
			return frames;
		},
		pending: () => callbacks.size > 0,
	};
}
