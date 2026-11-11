import { DocsNav } from "@/components/docs-nav";
import { DocsOutline } from "@/components/docs-outline";
import { DocsPager } from "@/components/docs-pager";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
	return (
		<div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-10 px-4 sm:px-6 xl:gap-12">
			<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto py-8 md:block">
				<DocsNav />
			</aside>
			<article className="mx-auto w-full min-w-0 max-w-2xl flex-1 py-8 md:py-10">
				{children}
				<DocsPager />
			</article>
			<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 xl:block">
				<DocsOutline />
			</aside>
		</div>
	);
}
