import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:gap-12">
			<aside className="md:sticky md:top-10 md:w-48 md:shrink-0 md:self-start">
				<DocsNav />
			</aside>
			<article className="min-w-0 max-w-2xl flex-1">{children}</article>
		</div>
	);
}
