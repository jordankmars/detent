import type { MDXComponents } from "mdx/types";
import { external } from "@/lib/links";

const components: MDXComponents = {
	h1: (props) => (
		<h1 className="mb-4 text-3xl font-semibold tracking-tight" {...props} />
	),
	h2: (props) => (
		<h2
			className="mt-10 mb-3 text-xl font-semibold tracking-tight"
			{...props}
		/>
	),
	p: (props) => (
		<p
			className="my-4 leading-7 text-neutral-600 dark:text-neutral-300"
			{...props}
		/>
	),
	a: (props) => (
		<a
			{...(/^https?:\/\//.test(props.href ?? "") ? external : {})}
			className="font-medium underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
			{...props}
		/>
	),
	ul: (props) => (
		<ul
			className="my-4 list-disc space-y-1 pl-6 text-neutral-600 dark:text-neutral-300"
			{...props}
		/>
	),
	code: (props) => (
		<code
			className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.875em] dark:bg-neutral-800"
			{...props}
		/>
	),
	pre: (props) => (
		<pre
			className="my-6 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-[13px] leading-6 [tab-size:2] dark:border-neutral-800 dark:bg-neutral-900 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
			{...props}
		/>
	),
};

export function useMDXComponents(): MDXComponents {
	return components;
}
