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
			{ title: "Styling", href: "/docs/styling" },
		],
	},
	{
		title: "Examples",
		pages: [
			{ title: "Dates and Times", href: "/docs/examples/dates-and-times" },
		],
	},
];

export const DOCS = SECTIONS.flatMap((section) => section.pages);
