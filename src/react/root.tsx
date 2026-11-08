"use client";

import {
	Children,
	type ComponentPropsWithoutRef,
	cloneElement,
	Fragment,
	forwardRef,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	type RefAttributes,
	useRef,
	useState,
} from "react";
import type { Wheel as Engine } from "../core";
import {
	RootContext,
	type RootContextValue,
	SlotContext,
	safely,
} from "./context";
import { Wheel } from "./wheel";

export interface RootProps<V = string>
	extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue"> {
	/** The value of each wheel, in the order the wheels appear. */
	value?: readonly V[];
	/** Starting values when `value` isn't controlled. */
	defaultValue?: readonly V[];
	/** Called as each wheel crosses an item. */
	onValueChange?: (value: V[]) => void;
	/** Called when a change made by the user comes to rest. */
	onValueCommit?: (value: V[]) => void;
	disabled?: boolean;
}

interface ElementWithChildren {
	children?: ReactNode;
	index?: number;
}

/**
 * Gives each wheel its position, looking through fragments and plain elements
 * so separators and layout wrappers don't affect the numbering.
 */
function assignSlots(children: ReactNode, next: { slot: number }): ReactNode {
	return Children.map(children, (child) => {
		if (!isValidElement<ElementWithChildren>(child)) return child;
		if (child.type === Wheel) {
			const slot = child.props.index ?? next.slot;
			next.slot = slot + 1;
			return <SlotContext.Provider value={slot}>{child}</SlotContext.Provider>;
		}
		if (
			(child.type === Fragment || typeof child.type === "string") &&
			child.props.children !== undefined
		) {
			return cloneElement(
				child,
				undefined,
				assignSlots(child.props.children, next),
			);
		}
		return child;
	});
}

function RootImpl<V>(
	{
		value: controlled,
		defaultValue,
		onValueChange,
		onValueCommit,
		disabled = false,
		children,
		...rest
	}: RootProps<V>,
	ref: Ref<HTMLDivElement>,
) {
	const [uncontrolled, setUncontrolled] = useState<readonly unknown[]>(
		defaultValue ?? [],
	);
	const latest = useRef<unknown[]>([]);
	const [engines] = useState(() => new Set<Engine>());

	const context: RootContextValue = {
		value: controlled ?? uncontrolled,
		latest,
		engines,
		itemHeight: 36,
		disabled,
		reducedMotion: false,
		change(next) {
			if (controlled === undefined) setUncontrolled(next);
			safely(() => onValueChange?.(next as V[]));
		},
		commit(next) {
			safely(() => onValueCommit?.(next as V[]));
		},
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: a fieldset would bring browser styling and form behavior
		<div ref={ref} role="group" data-detent-root="" {...rest}>
			<RootContext.Provider value={context}>
				{assignSlots(children, { slot: 0 })}
			</RootContext.Provider>
		</div>
	);
}

export const Root = forwardRef(RootImpl) as <V = string>(
	props: RootProps<V> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;
