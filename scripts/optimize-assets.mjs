import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public/assets");
const TARGET_WIDTH = 720;
const QUALITY = 78;

async function walk(dir) {
  const out = [];
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function main() {
  const files = await walk(ROOT);
  let saved = 0;
  for (const f of files) {
    if (!/\.png$/i.test(f)) continue;
    if (/logic\.png$/i.test(f)) continue;
    const stat = await fs.stat(f);
    if (stat.size < 80_000) continue;
    const out = f.replace(/\.png$/i, ".jpg");
    const meta = await sharp(f).metadata();
    const w = (meta.width ?? TARGET_WIDTH);
    await sharp(f)
      .resize(Math.min(w, TARGET_WIDTH))
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(out);
    const newStat = await fs.stat(out);
    await fs.unlink(f);
    console.log(`${path.basename(f)} ${(stat.size/1024).toFixed(0)}KB → ${path.basename(out)} ${(newStat.size/1024).toFixed(0)}KB`);
    saved += stat.size - newStat.size;
  }
  console.log(`Total saved: ${(saved/1024/1024).toFixed(2)} MB`);
}
main();
