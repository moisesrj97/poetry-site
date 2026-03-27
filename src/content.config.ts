import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const poems = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/poems" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
	}),
});

export const collections = { poems };
