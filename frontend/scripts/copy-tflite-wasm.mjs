import fs from "node:fs";
import path from "node:path";

const packageRoot = path.resolve("node_modules/@tensorflow/tfjs-tflite");
const outputRoot = path.resolve("public/wasm");
const distRoot = path.join(packageRoot, "dist");

if (!fs.existsSync(packageRoot)) {
  process.exit(0);
}

fs.mkdirSync(outputRoot, { recursive: true });

function copyWasmFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      copyWasmFiles(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".wasm")) {
      continue;
    }

    fs.copyFileSync(fullPath, path.join(outputRoot, entry.name));
  }
}

copyWasmFiles(packageRoot);

const webApiClientSource = path.join(
  packageRoot,
  "wasm",
  "tflite_web_api_client.js"
);
const webApiClientDest = path.join(distRoot, "tflite_web_api_client.js");

if (fs.existsSync(webApiClientSource)) {
  fs.copyFileSync(webApiClientSource, webApiClientDest);
}
