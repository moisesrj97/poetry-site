import sharp from "sharp";
import { readdirSync, statSync, renameSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";

const IMAGES_DIR = new URL("../../public/images", import.meta.url).pathname;
const CACHE_FILE = new URL("checksums.json", import.meta.url).pathname;
const JPEG_QUALITY = 80;
const PNG_QUALITY = { compressionLevel: 9, effort: 10 };

const cache = existsSync(CACHE_FILE)
	? JSON.parse(readFileSync(CACHE_FILE, "utf-8"))
	: {};

function sha256(filePath) {
	return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

const files = readdirSync(IMAGES_DIR);
let totalBefore = 0;
let totalAfter = 0;
let skipped = 0;
let compressed = 0;
let failed = 0;

for (const file of files) {
	const ext = extname(file).toLowerCase();
	if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;

	const filePath = join(IMAGES_DIR, file);
	const sizeBefore = statSync(filePath).size;
	totalBefore += sizeBefore;

	const currentHash = sha256(filePath);
	if (cache[file] === currentHash) {
		console.log(`· ${file}: skipped (already compressed)`);
		totalAfter += sizeBefore;
		skipped++;
		continue;
	}

	const tmpPath = filePath + ".tmp";

	try {
		const img = sharp(filePath);

		if (ext === ".png") {
			await img.png(PNG_QUALITY).toFile(tmpPath);
		} else {
			await img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmpPath);
		}

		const sizeAfter = statSync(tmpPath).size;
		renameSync(tmpPath, filePath);

		const compressedHash = sha256(filePath);
		cache[file] = compressedHash;

		const saved = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
		console.log(`✓ ${file}: ${kb(sizeBefore)} → ${kb(sizeAfter)} (−${saved}%)`);
		totalAfter += sizeAfter;
		compressed++;
	} catch (err) {
		console.error(`✗ ${file}: ${err.message}`);
		totalAfter += sizeBefore;
		failed++;
	}
}

writeFileSync(CACHE_FILE, JSON.stringify(cache, null, "\t"));

const savedTotal = totalBefore
	? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)
	: "0.0";
console.log(
	`\nTotal: ${kb(totalBefore)} → ${kb(totalAfter)} (−${savedTotal}%)${skipped ? `, ${skipped} skipped` : ""}`,
);

if (failed > 0) {
	console.error(`\nCompression failed for ${failed} image(s).`);
	process.exit(1);
}

if (compressed > 0) {
	console.error(`\nCompression updated ${compressed} image(s). Commit the optimized images and re-run.`);
	process.exit(1);
}

function kb(bytes) {
	return `${(bytes / 1024).toFixed(1)} KB`;
}
