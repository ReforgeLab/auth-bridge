import { execSync } from "child_process";
import { readdir, rename, mkdir, writeFile } from "fs/promises";
import { join, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function renameToCjs(dir) {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			await renameToCjs(fullPath);
		} else if (entry.isFile() && extname(entry.name) === ".js") {
			const newPath = join(dir, basename(entry.name, ".js") + ".cjs");
			await rename(fullPath, newPath);
		}
	}
}

async function updateImports(dir) {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			await updateImports(fullPath);
		} else if (entry.isFile() && extname(entry.name) === ".cjs") {
			const { readFile, writeFile } = await import("fs/promises");
			let content = await readFile(fullPath, "utf8");

			// Update require statements to use .cjs extension
			content = content.replace(/require\("(\..+?)"\)/g, 'require("$1.cjs")');

			await writeFile(fullPath, content, "utf8");
		}
	}
}

try {
	console.log("Building CommonJS with TypeScript...");
	execSync("tsc -p tsconfig.cjs.json", { stdio: "inherit" });

	console.log("Renaming .js files to .cjs...");
	await renameToCjs(join(__dirname, "dist/cjs-temp"));

	console.log("Updating import paths...");
	await updateImports(join(__dirname, "dist/cjs-temp"));

	console.log("Moving to final location...");
	await mkdir(join(__dirname, "dist/cjs"), { recursive: true });
	execSync("cp -r dist/cjs-temp/* dist/cjs/", { stdio: "inherit" });
	execSync("rm -rf dist/cjs-temp", { stdio: "inherit" });

	// Create package.json for CommonJS
	await writeFile(
		join(__dirname, "dist/cjs/package.json"),
		JSON.stringify({ type: "commonjs" }, null, 2),
	);

	console.log("CommonJS build complete!");
} catch (error) {
	console.error("Build failed:", error);
	process.exit(1);
}
