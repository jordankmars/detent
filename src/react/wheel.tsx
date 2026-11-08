"use client";

import {
	type ComponentPropsWithoutRef,
	type CSSProperties,
	forwardRef,
	memo,
	type ReactElement,
	type Ref,
	type RefAttributes,
	useContext,
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
	/** Position in the Root's value. Only needed inside your own component. */
	index?: number;
	/** The value reported for an item. Defaults to `item.value`, or the item. */
	getValue?: GetValue<T>;
	/** The text shown and spoken. Defaults to `item.label`, or the value. */
	getLabel?: GetLabel<T>;
}

interface RowProps {
	ring: number;
	binding: Binding;
	itemHeight: number;
	initial: InitialRow;
}

/**
 * One row. Renders once, then `paint` writes to the element directly, so its
 * props must never change or React would overwrite those writes.
 */
const Row = memo(function Row({
	ring,
	binding,
	itemHeight,
	initial,
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
			{initial.label}
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
	index: _index,
	getValue,
	getLabel,
	style,
	...rest
}: WheelBodyProps<T>) {
	const internal = useContext(InternalContext);
	const modelRef = useRef<ItemModel | null>(null);
	const model = reconcileItems(modelRef.current, items, getValue, getLabel);
	modelRef.current = model;

	const [binding] = useState(() =>
		createBinding({
			model,
			root,
			slot,
			loop,
			scheduler: internal.scheduler,
		}),
	);
	const [initial] = useState(() => binding.initialRows());

	const element = useRef<HTMLDivElement>(null);
	useImperativeHandle(
		forwardedRef,
		() => element.current as HTMLDivElement,
		[],
	);

	useIsomorphicLayoutEffect(() => {
		binding.props = { model, root, slot, loop };
	});
	useIsomorphicLayoutEffect(() => binding.connect(), [binding]);

	const { itemHeight } = root;
	const { wheelHeight, perspective } = geometry(itemHeight);

	return (
		<div
			ref={element}
			role="spinbutton"
			tabIndex={0}
			aria-valuenow={binding.engine.index}
			data-detent-wheel=""
			{...rest}
			style={{
				position: "relative",
				height: wheelHeight,
				touchAction: "none",
				perspective,
				...style,
			}}
		>
			{initial.map((row, ring) => (
				<Row
					// Rows are positions on a ring, so the ring index is the identity.
					// biome-ignore lint/suspicious/noArrayIndexKey: see above
					key={ring}
					ring={ring}
					binding={binding}
					itemHeight={itemHeight}
					initial={row}
				/>
			))}
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
		<WheelBody {...props} root={root} position={slot} forwardedRef={ref} />
	);
}

export const Wheel = forwardRef(WheelImpl) as <T = unknown>(
	props: WheelProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;
