export const SECTIONS = [
	{
		title: "Basics",
		pages: [{ title: "Getting Started", href: "/docs" }],
	},
];

export const DOCS = SECTIONS.flatMap((section) => section.pages);
