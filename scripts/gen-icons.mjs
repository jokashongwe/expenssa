import fs from "fs";
import path from "path";
import { createRequire } from "module";

// Generate simple resized PNGs without sharp: copy logo as icon sources.
// For PWA we also write 192/512 via a minimal canvas-less approach using the
// source file directly when possible; otherwise keep logo path in manifest.

const root = process.cwd();
const src = path.join(root, "public", "logo-expenssa-final.png");
const iconsDir = path.join(root, "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

// Prefer sharp if available; else duplicate logo for both sizes (browsers scale).
let wrote = false;
try {
  const require = createRequire(import.meta.url);
  const sharp = require("sharp");
  const buf = fs.readFileSync(src);
  await sharp(buf).resize(192, 192, { fit: "contain", background: { r: 15, g: 118, b: 110, alpha: 1 } }).png().toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 15, g: 118, b: 110, alpha: 1 } }).png().toFile(path.join(iconsDir, "icon-512.png"));
  await sharp(buf).resize(32, 32, { fit: "contain", background: { r: 15, g: 118, b: 110, alpha: 1 } }).png().toFile(path.join(root, "public", "favicon.png"));
  wrote = true;
  console.log("icons generated with sharp");
} catch {
  fs.copyFileSync(src, path.join(iconsDir, "icon-192.png"));
  fs.copyFileSync(src, path.join(iconsDir, "icon-512.png"));
  fs.copyFileSync(src, path.join(root, "public", "favicon.png"));
  console.log("icons copied from logo (sharp unavailable)");
}

console.log("done", wrote);
