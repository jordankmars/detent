export const SECTIONS = [
	{
		title: "Basics",
		pages: [
			{ title: "Getting Started", href: "/docs" },
			{ title: "API", href: "/docs/api" },
		],
	},
	{
		title: "Guides",
		pages: [
			{ title: "Items", href: "/docs/items" },
			{ title: "Linked Wheels", href: "/docs/linked-wheels" },
		],
	},
];

export const DOCS = SECTIONS.flatMap((section) => section.pages);
