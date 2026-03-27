import { readdirSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const IMAGES_DIR = new URL("../../public/images", import.meta.url).pathname;
const SRC_DIR = new URL("../../src", import.meta.url).pathname;

const images = readdirSync(IMAGES_DIR).filter((f) =>
	[".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(
		extname(f).toLowerCase(),
	),
);

async function collectSrcFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectSrcFiles(full)));
		} else if ([".md", ".astro", ".ts", ".tsx", ".js"].includes(extname(entry.name))) {
			files.push(full);
		}
	}
	return files;
}

const srcFiles = await collectSrcFiles(SRC_DIR);
const allContent = (
	await Promise.all(srcFiles.map((f) => readFile(f, "utf-8")))
).join("\n");

const unused = images.filter((img) => !allContent.includes(img));

if (unused.length === 0) {
	console.log("✓ All images are referenced in src/");
} else {
	console.log(`Found ${unused.length} unused image(s):\n`);
	for (const img of unused) {
		console.log(`  · public/images/${img}`);
	}
	process.exit(1);
}
