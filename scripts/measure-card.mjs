// Measure the photo frame on a boy card: find the dark border rectangle
// around the photo and report its bounding box + tilt.
import sharp from "sharp";

const paths = [
  "public/assets/boys/george.jpg",
  "public/assets/boys/phil.jpg",
  "public/assets/boys/dave.jpg",
  "public/assets/boys/alan.jpg",
  "public/assets/boys/bruce.jpg",
];

for (const p of paths) {
  const img = sharp(p);
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  // raw is RGB interleaved when no alpha; check channels:
  const { channels } = await img.metadata();
  const ch = channels;

  // Build "is dark" mask: pixels where R,G,B all < 60.
  const dark = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * ch;
      const r = raw[i], g = raw[i + 1], b = raw[i + 2];
      if (r < 60 && g < 60 && b < 60) dark[y * width + x] = 1;
    }
  }

  // The photo frame is a roughly-rectangular dark border AROUND a bright
  // photo region. We can find it by scanning each row and looking for the
  // leftmost and rightmost dark pixel — that traces the frame outline.
  // Skip rows in the top 18% (the banner) and bottom 10% (phone strip).
  const yStart = Math.floor(height * 0.18);
  const yEnd = Math.floor(height * 0.90);

  // Find left edge x-position per row, right edge per row.
  const leftXs = [];
  const rightXs = [];
  for (let y = yStart; y < yEnd; y++) {
    let leftX = -1, rightX = -1;
    for (let x = 0; x < width; x++) {
      if (dark[y * width + x]) { leftX = x; break; }
    }
    for (let x = width - 1; x >= 0; x--) {
      if (dark[y * width + x]) { rightX = x; break; }
    }
    if (leftX >= 0 && rightX > leftX + width * 0.3) {
      leftXs.push({ y, x: leftX });
      rightXs.push({ y, x: rightX });
    }
  }

  // Photo top and bottom: find rows where the left edge first appears at a
  // photo-frame-like x (between 5% and 30% of width) and stays there.
  function bbox(pts) {
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    for (const { x, y } of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    return { minX, maxX, minY, maxY };
  }

  // Fit a line through the LEFT edge points using least-squares to get tilt.
  function fitLine(pts) {
    const n = pts.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (const { x, y } of pts) { sx += y; sy += x; sxy += y * x; sxx += y * y; }
    // x as function of y: x = a + b*y  (we want dx/dy = b)
    const denom = n * sxx - sx * sx;
    if (denom === 0) return { a: 0, b: 0 };
    const b = (n * sxy - sx * sy) / denom;
    const a = (sy - b * sx) / n;
    return { a, b };
  }

  // Sample only the middle band of rows (avoid where the frame is broken)
  const yLo = Math.floor(height * 0.22);
  const yHi = Math.floor(height * 0.78);
  const leftBand = leftXs.filter(p => p.y >= yLo && p.y <= yHi);
  const rightBand = rightXs.filter(p => p.y >= yLo && p.y <= yHi);
  const leftFit = fitLine(leftBand);
  const rightFit = fitLine(rightBand);

  // tilt angle from left edge slope (dx/dy = b → angle from vertical)
  const angleLeft = Math.atan(leftFit.b) * 180 / Math.PI;
  const angleRight = Math.atan(rightFit.b) * 180 / Math.PI;

  const lbb = bbox(leftBand);
  const rbb = bbox(rightBand);

  console.log(`\n=== ${p} (${width} x ${height}) ===`);
  console.log(`Photo left edge: x ≈ ${Math.round(lbb.minX)}–${Math.round(lbb.maxX)}, y ${lbb.minY}–${lbb.maxY}`);
  console.log(`Photo right edge: x ≈ ${Math.round(rbb.minX)}–${Math.round(rbb.maxX)}, y ${rbb.minY}–${rbb.maxY}`);
  console.log(`Tilt: left edge ${angleLeft.toFixed(2)}°, right edge ${angleRight.toFixed(2)}° (from vertical, + = leans right)`);
  // Width relative to card width
  const photoW = ((rbb.minX + rbb.maxX) / 2) - ((lbb.minX + lbb.maxX) / 2);
  console.log(`Photo width: ~${Math.round(photoW)} (${(photoW / width * 100).toFixed(1)}% of card)`);
  console.log(`Left margin: ~${((lbb.minX) / width * 100).toFixed(1)}% of card`);
  console.log(`Right margin: ~${((width - rbb.maxX) / width * 100).toFixed(1)}% of card`);
  console.log(`Top of photo (left edge minY): ${(lbb.minY / height * 100).toFixed(1)}% of card`);
  console.log(`Bottom of photo (left edge maxY): ${(lbb.maxY / height * 100).toFixed(1)}% of card`);
}
