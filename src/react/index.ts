// React adapter. Published as detent/react.
//
// This file must not have a "use client" directive. `Detent` has to be a real
// object on the server, because dotting into a client reference (`Detent.Root`)
// throws in a server component. The directives are on the modules it re-exports.

export type { RootProps, WheelProps } from "./parts";
export * as Detent from "./parts";
