# detent

The iOS scroll-wheel picker for the web, for times, dates or any list.

```tsx
<Detent.Root value={time} onValueChange={setTime}>
  <Detent.Wheel items={hours} loop />
  <Detent.Wheel items={minutes} loop />
  <Detent.Wheel items={["AM", "PM"]} />
</Detent.Root>
```

> **Status:** early development, not published yet.

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

## React

```tsx
import { Detent } from "detent/react";

function TimePicker() {
  const [time, setTime] = useState(["9", "41", "AM"]);

  return (
    <Detent.Root value={time} onValueChange={setTime} aria-label="Time">
      <Detent.Wheel items={hours} loop aria-label="Hour" />
      <span>:</span>
      <Detent.Wheel items={minutes} loop aria-label="Minute" />
      <Detent.Wheel items={["AM", "PM"]} aria-label="AM or PM" />
    </Detent.Root>
  );
}
```

No stylesheet to import. It renders the cylinder and center band as is, and
inherits color and font from the page.

### `Detent.Root`

| Prop            | Type                   | Description                                                          |
| --------------- | ---------------------- | -------------------------------------------------------------------- |
| `value`         | `V[]`                  | The value of each wheel, in the order the wheels appear.             |
| `defaultValue`  | `V[]`                  | Starting values when `value` isn't controlled.                       |
| `onValueChange` | `(value: V[]) => void` | Called as a wheel crosses each item.                                 |
| `onValueCommit` | `(value: V[]) => void` | Called when a change made by the user comes to rest.                 |
| `disabled`      | `boolean`              | Disables every wheel.                                                |
| `itemHeight`    | `number`               | Height of one item in pixels, default 36. Everything scales with it. |
| `reducedMotion` | `boolean`              | Overrides the user's `prefers-reduced-motion` setting.               |

### `Detent.Wheel`

| Prop         | Type                                    | Description                                                               |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `items`      | `T[]`                                   | Strings, numbers, `{ value, label }`, or anything with the readers below. |
| `loop`       | `boolean`                               | Wrap around from the last item to the first.                              |
| `disabled`   | `boolean`                               | Disables this wheel.                                                      |
| `getValue`   | `(item: T) => unknown`                  | The value reported for an item. Defaults to `item.value`, or the item.    |
| `getLabel`   | `(item: T) => string`                   | The text shown and spoken. Defaults to `item.label`, or the value.        |
| `renderItem` | `(item: T, index: number) => ReactNode` | Custom row content. `getLabel` still provides the spoken text.            |
| `index`      | `number`                                | Position in the Root's value. See below.                                  |

Both components forward a ref and any other props to their `div`. Give each
wheel an `aria-label`, since it's what a screen reader announces.

Without `renderItem`, rows are updated outside React and motion costs no
renders. With it, keep the function stable (`useCallback` or module scope) so
rows only render when their item changes.

### Wheel positions

A wheel's position is its order among the Root's `Detent.Wheel`s, looking
through fragments and plain elements. Separators don't count. A wheel rendered
inside your own component can't be seen from the Root, so give it an `index`.
The same goes for wheels whose parent is a server component. Pass `index` to
every wheel if you pass it to one.

### Linked wheels

Derive the items from the value. If the selected item disappears, the wheel
moves to the nearest one and reports it through `onValueChange`.

```tsx
const [month, day, year] = value;
const days = useMemo(() => daysIn(month, year), [month, year]);

<Detent.Root value={value} onValueChange={setValue}>
  <Detent.Wheel items={months} />
  <Detent.Wheel items={days} />
  <Detent.Wheel items={years} />
</Detent.Root>;
```

A controlled wheel follows the parent: changing `value` animates to the new
item, and if the parent ignores or alters a change, the wheel moves to match
when it comes to rest. As with controlled inputs, avoid updating `value` inside
`startTransition`, or the wheel can snap back before the update lands.

### Styling

Default styles have no specificity, so any CSS you write wins.

```css
[data-detent-band] { background: white; border-radius: 12px; }
[data-detent-wheel] { flex: none; width: 64px; }
[data-detent-item] { color: gray; font-size: 18px; }
[data-detent-item][data-selected] { color: black; }
```

The parts are `data-detent-root`, `data-detent-band`, `data-detent-wheel` and
`data-detent-item`, plus `data-selected` and `data-disabled`.

Cascade layers, including Tailwind's utilities, can't beat those defaults on
the same property. Set a variable instead, for example
`[--detent-band-background:white]`:

| Variable                    | Default               |
| --------------------------- | --------------------- |
| `--detent-gap`              | `2px`                 |
| `--detent-band-background`  | `currentColor` at 9%  |
| `--detent-band-radius`      | `10px`                |
| `--detent-band-inset`       | `0`                   |
| `--detent-wheel-flex`       | `1 1 0`               |
| `--detent-item-font-size`   | `21px`                |
| `--detent-item-color`       | `currentColor` at 55% |
| `--detent-disabled-opacity` | `0.5`                 |

## How it's built

The engine in `src/core` doesn't touch the DOM. It takes pointer positions, key
names and scroll deltas as plain numbers, runs the physics, and hands back the
layout for each visible row. Framework adapters bind events and paint rows.
That keeps the engine easy to test and lets each adapter render however it
likes.

| Framework | Import path     | Status  |
| --------- | --------------- | ------- |
| React     | `detent/react`  | Ready   |
| Vue       | `detent/vue`    | Planned |
| Svelte    | `detent/svelte` | Planned |

## Development

```sh
pnpm install
pnpm play        # playground at http://localhost:5173
pnpm test        # unit tests
pnpm typecheck
pnpm lint
pnpm build
```

The playground (`playground/main.tsx`) runs the React adapter and shows live
engine state for every wheel. It's the quickest way to try out a change.

## Contributing

Contributions are welcome. Please open an issue to discuss changes before
submitting a pull request.

## License

[MIT](./LICENSE)
