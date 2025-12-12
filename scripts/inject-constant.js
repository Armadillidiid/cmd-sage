import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const distFile = join(rootDir, "dist/index.js");

try {
	let content = readFileSync(distFile, "utf-8");

	// Replace __VERSION__ and __NAME__ with actual values
	content = content.replace(/__VERSION__/g, `"${pkg.version}"`);
	content = content.replace(/__NAME__/g, `"${pkg.name}"`);

	writeFileSync(distFile, content, "utf-8");
	console.log(`✓ Injected version ${pkg.version} and name ${pkg.name}`);
} catch (error) {
	console.error("Failed to inject version:", error);
	process.exit(1);
}
