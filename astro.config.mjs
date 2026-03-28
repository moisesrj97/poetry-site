// @ts-check
import { defineConfig } from "astro/config";
import remarkBreaks from "remark-breaks";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	integrations: [react()],

	markdown: {
		remarkPlugins: [remarkBreaks],
	},

	vite: {
		plugins: [tailwindcss()],
	},
});
