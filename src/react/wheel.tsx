"use client";

import {
	type ComponentPropsWithoutRef,
	type CSSProperties,
	Fragment,
	forwardRef,
	type KeyboardEvent,
	memo,
	type PointerEvent,
	type ReactElement,
	type ReactNode,
	type Ref,
	type RefAttributes,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	type Binding,
	createBinding,
	geometry,
	type InitialRow,
} from "./binding";
import {
	InternalContext,
	RootContext,
	type RootContextValue,
	SlotContext,
	useIsomorphicLayoutEffect,
} from "./context";
import {
	type GetLabel,
	type GetValue,
	type ItemModel,
	reconcileItems,
} from "./items";

export interface WheelProps<T = unknown>
	extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	items: readonly T[];
	/** Wrap around from the last item to the first. */
	loop?: boolean;
	disabled?: boolean;
	/** Position in the Root's value. Only needed inside your own component. */
	index?: number;
	/** The value reported for an item. Defaults to `item.value`, or the item. */
	getValue?: GetValue<T>;
	/** The text shown and spoken. Defaults to `item.label`, or the value. */
	getLabel?: GetLabel<T>;
	/** Custom row content. `getLabel` still provides the spoken text. */
	renderItem?: (item: T, index: number) => ReactNode;
}

interface RowProps {
	ring: number;
	binding: Binding;
	itemHeight: number;
	initial: InitialRow;
	/** Present only for rows React renders. */
	renderItem?: (item: never, index: number) => ReactNode;
	item?: unknown;
	index?: number;
}

/**
 * One row. `paint` writes position and text straight to the element, so those
 * props come from `initial`, which never changes, and React leaves them alone.
 */
const Row = memo(function Row({
	ring,
	binding,
	itemHeight,
	initial,
	renderItem,
	item,
	index = -1,
}: RowProps) {
	const style: CSSProperties = {
		position: "absolute",
		left: 0,
		right: 0,
		top: "50%",
		height: itemHeight,
		marginTop: -itemHeight / 2,
		lineHeight: `${itemHeight}px`,
		whiteSpace: "nowrap",
		backfaceVisibility: "hidden",
		transform: initial.transform,
		opacity: initial.opacity,
		visibility: initial.visible ? undefined : "hidden",
	};
	return (
		<div
			ref={(element) => {
				binding.rows[ring] = element;
			}}
			data-detent-item=""
			data-selected={initial.selected ? "" : undefined}
			aria-hidden
			style={style}
		>
			{!renderItem ? (
				initial.label
			) : index >= 0 ? (
				// Keyed so a row reused for another item starts with fresh state.
				<Fragment key={index}>{renderItem(item as never, index)}</Fragment>
			) : null}
		</div>
	);
});

interface WheelBodyProps<T> extends WheelProps<T> {
	root: RootContextValue;
	position: number;
	forwardedRef: Ref<HTMLDivElement>;
}

function WheelBody<T>({
	root,
	position: slot,
	forwardedRef,
	items,
	loop = false,
	disabled: disabledProp = false,
	index: _index,
	getValue,
	getLabel,
	renderItem,
	style,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onPointerCancel,
	onLostPointerCapture,
	onKeyDown,
	...rest
}: WheelBodyProps<T>) {
	const internal = useContext(InternalContext);
	const disabled = disabledProp || root.disabled;
	const modelRef = useRef<ItemModel | null>(null);
	const model = reconcileItems(modelRef.current, items, getValue, getLabel);
	modelRef.current = model;

	const custom = renderItem !== undefined;
	const [requestedRows, setRowItems] = useState<number[] | null>(null);
	const [settled, setSettled] = useState(0);
	const onUserSettle = useCallback(() => setSettled((n) => n + 1), []);

	const [binding] = useState(() =>
		createBinding({
			model,
			root,
			slot,
			loop,
			disabled,
			onUserSettle,
			custom,
			onRowsChange: setRowItems,
			scheduler: internal.scheduler,
		}),
	);
	const [initial] = useState(() => binding.initialRows());
	const [initialItems] = useState(() => initial.map((row) => row.index));
	const rowItems = requestedRows ?? initialItems;
	const [aria] = useState(() => binding.initialAria());
	const { engine } = binding;

	const element = useRef<HTMLDivElement>(null);
	useImperativeHandle(
		forwardedRef,
		() => element.current as HTMLDivElement,
		[],
	);

	useIsomorphicLayoutEffect(() => {
		binding.props = {
			model,
			root,
			slot,
			loop,
			disabled,
			onUserSettle,
			custom,
			onRowsChange: setRowItems,
		};
	});
	// Switching modes replaces the rows, so `custom` is the trigger here.
	useIsomorphicLayoutEffect(() => binding.resetRows(), [binding, custom]);
	useIsomorphicLayoutEffect(
		() => binding.commitRows(rowItems),
		[binding, rowItems],
	);
	useIsomorphicLayoutEffect(
		() => binding.connect(element.current as HTMLElement),
		[binding],
	);

	const wanted = root.value[slot];
	// `sync` reads these from `binding.props`, set by the effect above.
	useIsomorphicLayoutEffect(
		() => binding.sync(),
		[binding, model, loop, wanted, settled],
	);

	const { register } = internal;
	useEffect(
		() => register?.(engine, element.current as HTMLElement),
		[engine, register],
	);

	const { reducedMotion } = root;
	useEffect(() => {
		engine.setReducedMotion(reducedMotion);
	}, [engine, reducedMotion]);

	const activePointer = useRef<number | null>(null);

	useEffect(() => {
		if (disabled && activePointer.current !== null) {
			activePointer.current = null;
			engine.pointerCancel();
		}
	}, [disabled, engine]);

	const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
		onPointerDown?.(event);
		if (
			event.defaultPrevented ||
			disabled ||
			event.button !== 0 ||
			activePointer.current !== null
		) {
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		activePointer.current = event.pointerId;
		binding.input(() => {
			engine.pointerDown(event.clientY);
			return engine.dragging;
		});
	};

	const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
		onPointerMove?.(event);
		if (event.pointerId === activePointer.current) {
			engine.pointerMove(event.clientY);
		}
	};

	const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
		onPointerUp?.(event);
		if (event.pointerId !== activePointer.current) return;
		activePointer.current = null;
		const rect = event.currentTarget.getBoundingClientRect();
		engine.pointerUp(event.clientY - (rect.top + rect.height / 2));
	};

	const cancelPointer = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerId !== activePointer.current) return;
		activePointer.current = null;
		engine.pointerCancel();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		onKeyDown?.(event);
		if (event.defaultPrevented || disabled) return;
		if (binding.input(() => engine.key(event.key))) event.preventDefault();
	};

	const { itemHeight } = root;
	const { wheelHeight, perspective } = geometry(itemHeight);

	return (
		<div
			ref={element}
			role="spinbutton"
			tabIndex={disabled ? -1 : 0}
			aria-valuemin={aria.max === undefined ? undefined : 0}
			aria-valuemax={aria.max}
			aria-valuenow={aria.now}
			aria-valuetext={aria.text}
			aria-disabled={disabled || undefined}
			data-detent-wheel=""
			data-disabled={disabled ? "" : undefined}
			{...rest}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={(event) => {
				onPointerCancel?.(event);
				cancelPointer(event);
			}}
			onLostPointerCapture={(event) => {
				onLostPointerCapture?.(event);
				cancelPointer(event);
			}}
			onKeyDown={handleKeyDown}
			style={{
				position: "relative",
				height: wheelHeight,
				touchAction: "none",
				perspective,
				...style,
			}}
		>
			{initial.map((row, ring) => {
				const item = rowItems[ring] < items.length ? rowItems[ring] : -1;
				return (
					<Row
						// biome-ignore lint/suspicious/noArrayIndexKey: rows are positions on a ring, so the ring index is the identity
						key={`${custom ? "custom" : "text"}-${ring}`}
						ring={ring}
						binding={binding}
						itemHeight={itemHeight}
						initial={row}
						{...(custom && {
							renderItem: renderItem as RowProps["renderItem"],
							item: items[item],
							index: item,
						})}
					/>
				);
			})}
		</div>
	);
}

function WheelImpl<T>(props: WheelProps<T>, ref: Ref<HTMLDivElement>) {
	const root = useContext(RootContext);
	const assigned = useContext(SlotContext);
	if (!root) throw new Error("Detent.Wheel must be inside Detent.Root.");
	const slot = props.index ?? assigned;
	if (slot === undefined) {
		throw new Error(
			"Detent.Wheel can't find its position. Pass an `index` prop when " +
				"rendering it inside your own component.",
		);
	}
	return (
		// The engine's geometry is fixed when it's created.
		<WheelBody
			key={root.itemHeight}
			{...props}
			root={root}
			position={slot}
			forwardedRef={ref}
		/>
	);
}

export const Wheel = forwardRef(WheelImpl) as <T = unknown>(
	props: WheelProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;
