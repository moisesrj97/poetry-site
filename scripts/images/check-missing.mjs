import { readdirSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const IMAGES_DIR = new URL("../../public/images", import.meta.url).pathname;
const SRC_DIR = new URL("../../src", import.meta.url).pathname;

const existing = new Set(readdirSync(IMAGES_DIR));

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

const missing = [];

for (const file of srcFiles) {
	const content = await readFile(file, "utf-8");
	const matches = content.matchAll(/\/images\/([^\s)"']+)/g);
	for (const [, imgFile] of matches) {
		if (!existing.has(imgFile)) {
			missing.push({ file: file.replace(SRC_DIR + "/", ""), image: imgFile });
		}
	}
}

if (missing.length === 0) {
	console.log("✓ All referenced images exist in public/images/");
} else {
	console.log(`Found ${missing.length} missing image(s):\n`);
	for (const { file, image } of missing) {
		console.log(`  · /images/${image}`);
		console.log(`    referenced in: src/${file}`);
	}
	process.exit(1);
}
