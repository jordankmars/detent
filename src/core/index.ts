// Framework-agnostic core. Internal: not exported on its own.
export type { FrameLoop, FrameTask, Scheduler } from "./frame-loop";
export { browserScheduler } from "./frame-loop";
export type { Wheel, WheelOptions, WheelSlot } from "./wheel";
export { createWheel } from "./wheel";
