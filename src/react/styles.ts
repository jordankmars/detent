/**
 * The default look. Everything is inside `:where()`, which has no specificity,
 * so any CSS a consumer writes wins. Tailwind's utilities are in a cascade
 * layer and lose to unlayered rules however specific they are, so the values
 * are also read from variables, which a utility can set.
 */
export const DEFAULT_STYLES = `
:where([data-tambour-root]){gap:var(--tambour-gap,2px)}
:where([data-tambour-band]){left:var(--tambour-band-inset,0);right:var(--tambour-band-inset,0);background:var(--tambour-band-background,color-mix(in srgb,currentColor 9%,transparent));border-radius:var(--tambour-band-radius,10px)}
:where([data-tambour-wheel]){flex:var(--tambour-wheel-flex,1 1 0);min-width:0;cursor:grab;-webkit-mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent);mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent)}
:where([data-tambour-wheel]:active){cursor:grabbing}
:where([data-tambour-wheel][data-disabled]){cursor:default;opacity:var(--tambour-disabled-opacity,.5)}
:where([data-tambour-item]){text-align:center;font-size:var(--tambour-item-font-size,21px);font-variant-numeric:tabular-nums}
:where([data-tambour-item]:not([data-selected])){color:var(--tambour-item-color,color-mix(in srgb,currentColor 55%,transparent))}
`;
