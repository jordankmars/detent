# detent

The iOS scroll-wheel picker for the web, for times, dates or any list.

```tsx
<Detent.Root value={time} onValueChange={setTime}>
  <Detent.Wheel items={hours} loop />
  <Detent.Wheel items={minutes} loop />
  <Detent.Wheel items={["AM", "PM"]} />
</Detent.Root>
```

> **Status:** early development. The engine works and is tested. The React
> components above are next and haven't been published yet.

## What it does

- Momentum is projected from the flick, then snaps to an item. Lists can loop
  or stop at the ends with a rubber-band stretch.
- Rows sit on a 3D cylinder behind a center band.
- Drag, flick, tap an item, mouse wheel, trackpad and keyboard all work.
- Wheels can be linked, so the number of days follows the month.
- Trackpad scrolling stops where your fingers do, and a wheel at its end lets
  the page scroll instead of trapping it.
- Each wheel is exposed to screen readers as a spinbutton with a spoken value.
- Looping lists have no visible seam, and only eleven rows are ever rendered,
  so a list of ten thousand values costs the same as a list of ten.
- Respects `prefers-reduced-motion`.

## How it's built

The engine in `src/core` doesn't touch the DOM. It takes pointer positions, key
names and scroll deltas as plain numbers, runs the physics, and hands back the
layout for each visible row. Framework adapters bind events and paint rows.
That keeps the engine easy to test and lets each adapter render however it
likes.

| Framework | Import path     | Status      |
| --------- | --------------- | ----------- |
| React     | `detent/react`  | In progress |
| Vue       | `detent/vue`    | Planned     |
| Svelte    | `detent/svelte` | Planned     |

## Development

```sh
pnpm install
pnpm play        # playground at http://localhost:5173
pnpm test        # unit tests
pnpm typecheck
pnpm lint
pnpm build
```

The playground (`playground/main.tsx`) drives the engine directly, without the
adapter, and shows live engine state for every wheel. It's the quickest way to
try out a change to the physics.

## Contributing

Contributions are welcome. Please open an issue to discuss changes before
submitting a pull request.

## License

[MIT](./LICENSE)
