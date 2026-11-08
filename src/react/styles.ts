/**
 * The default look. Everything is inside `:where()`, which has no specificity,
 * so any CSS a consumer writes wins. Tailwind's utilities are in a cascade
 * layer and lose to unlayered rules however specific they are, so the values
 * are also read from variables, which a utility can set.
 */
export const DEFAULT_STYLES = `
:where([data-detent-root]){gap:var(--detent-gap,2px)}
:where([data-detent-band]){background:var(--detent-band-background,color-mix(in srgb,currentColor 9%,transparent));border-radius:var(--detent-band-radius,10px)}
:where([data-detent-wheel]){flex:var(--detent-wheel-flex,1 1 0);min-width:0;cursor:grab;-webkit-mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent);mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent)}
:where([data-detent-wheel]:active){cursor:grabbing}
:where([data-detent-wheel][data-disabled]){cursor:default;opacity:var(--detent-disabled-opacity,.5)}
:where([data-detent-item]){text-align:center;font-size:var(--detent-item-font-size,21px);font-variant-numeric:tabular-nums}
:where([data-detent-item]:not([data-selected])){color:var(--detent-item-color,color-mix(in srgb,currentColor 55%,transparent))}
`;
