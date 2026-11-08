// Development playground for the core. Everything lives in this one file on
// purpose: it wires the engine to the DOM by hand, without the React adapter.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
	return (
		<main>
			<h1>detent</h1>
		</main>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
