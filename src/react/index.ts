// React adapter. Published as tambour/react.
//
// This file must not have a "use client" directive. `Tambour` has to be a real
// object on the server, because dotting into a client reference (`Tambour.Root`)
// throws in a server component. The directives are on the modules it re-exports.

export type { RootProps, WheelProps } from "./parts";
export * as Tambour from "./parts";
