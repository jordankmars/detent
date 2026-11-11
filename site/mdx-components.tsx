import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { DocsPagerIcons } from "@/components/docs-pager";
import { Install } from "@/components/install";
import { external } from "@/lib/links";

const body = "text-neutral-600 dark:text-neutral-300";

type Fence = ReactElement<{
	children: ReactElement<{ className?: string; children: string }>;
}>;

/** MDX hands over <pre><code class="language-x">source</code></pre>. */
function fenced(pre: Fence["props"]) {
	const { className, children } = pre.children.props;
	return {
		code: children,
		lang: className?.replace("language-", "") ?? "text",
	};
}

function Anchor({ id }: { id?: string }) {
	return (
		<a
			href={`#${id}`}
			aria-label="Link to this section"
			className="ml-2 font-normal text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
		>
			#
		</a>
	);
}

/** The muted line under a page's title. */
function Lead({ children }: { children: ReactNode }) {
	return (
		<p className="mt-2 mb-8 text-[1.05rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
			{children}
		</p>
	);
}

/** A fenced code block with its filename above it. */
function CodeFile({ name, children }: { name: string; children: Fence }) {
	return <CodeBlock {...fenced(children.props)} filename={name} />;
}

const components: MDXComponents = {
	Lead,
	CodeFile,
	Install,
	h1: (props) => (
		<div className="flex items-start justify-between gap-4">
			<h1
				className="text-3xl font-semibold tracking-tight sm:text-4xl"
				{...props}
			/>
			<DocsPagerIcons />
		</div>
	),
	h2: ({ children, ...props }: ComponentProps<"h2">) => (
		<h2
			className="group mt-12 mb-4 scroll-mt-20 border-b border-neutral-200 pb-2 text-xl font-semibold tracking-tight dark:border-neutral-800"
			{...props}
		>
			{children}
			<Anchor id={props.id} />
		</h2>
	),
	h3: ({ children, ...props }: ComponentProps<"h3">) => (
		<h3
			className="group mt-8 mb-2 scroll-mt-20 text-lg font-semibold tracking-tight"
			{...props}
		>
			{children}
			<Anchor id={props.id} />
		</h3>
	),
	p: (props) => <p className={`my-4 leading-relaxed ${body}`} {...props} />,
	a: (props) => (
		<a
			{...(/^https?:\/\//.test(props.href ?? "") ? external : {})}
			className="font-medium underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 dark:decoration-neutral-700 dark:hover:decoration-neutral-100"
			{...props}
		/>
	),
	ul: (props) => (
		<ul className={`my-4 list-disc space-y-1 pl-6 ${body}`} {...props} />
	),
	ol: (props) => (
		<ol className={`my-4 list-decimal space-y-1 pl-6 ${body}`} {...props} />
	),
	code: (props) => (
		<code
			className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.875em] dark:bg-neutral-800"
			{...props}
		/>
	),
	table: (props) => (
		<div className="my-6 overflow-x-auto">
			<table className="w-full border-collapse text-sm" {...props} />
		</div>
	),
	th: (props) => (
		<th
			className="border-b border-neutral-200 py-2 pr-4 text-left font-medium dark:border-neutral-800"
			{...props}
		/>
	),
	td: (props) => (
		<td
			className={`border-b border-neutral-100 py-2 pr-4 align-top dark:border-neutral-900 ${body}`}
			{...props}
		/>
	),
	pre: (props) => <CodeBlock {...fenced(props as Fence["props"])} />,
};

export function useMDXComponents(): MDXComponents {
	return components;
}
