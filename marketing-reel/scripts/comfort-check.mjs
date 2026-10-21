import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderFrames, renderStill, selectComposition } from '@remotion/renderer';
import sharp from 'sharp';

// Eye-comfort check for the R25–R36 sprint (bible §6). Not a test framework: it
// renders the composition at low resolution, measures luminance, and reports
//   • flashes: in each of 9 screen tiles (each ≥ 10% of the frame), luminance swings of
//     ≥ 0.10 up-and-back; more than 3 flashes inside any one-second window fails;
//   • brightness jumps: any 10-frame window whose average frame luminance changes by
//     more than 20% (relative) — allowed only at hard cuts the brief marks;
//   • contrast (optional): `--contrast=FRAME@x,y,w,h;…` measures the ratio between the
//     dark and light ends (5th/95th percentile) of each region at full resolution.
// Usage: node scripts/comfort-check.mjs Qissati-R26 [--contrast=330@180,404,720,120]

const id = process.argv[2];
if (!id) throw new Error('Usage: node scripts/comfort-check.mjs <composition-id> [--contrast=…]');
const contrastArg = process.argv.find((a) => a.startsWith('--contrast='))?.slice(11);
const outDir = resolve(`out/comfort/${id}`);
const framesDir = `${outDir}/frames`;
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const chromiumOptions = { gl: 'angle' };
const serveUrl = await bundle({ entryPoint: resolve('src/index.jsx'), rootDir: process.cwd(), rspack: true });
const browser = await openBrowser('chrome', { chromiumOptions });
const contrast = [];
let composition;
try {
  composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, chromiumOptions });
  await renderFrames({
    serveUrl, composition, outputDir: framesDir, imageFormat: 'jpeg', jpegQuality: 70, scale: 0.1,
    puppeteerInstance: browser, chromiumOptions, inputProps: {}, onStart: () => {}, onFrameUpdate: () => {},
  });
  for (const spec of (contrastArg ?? '').split(';').filter(Boolean)) {
    const [frameText, box] = spec.split('@');
    const [left, top, width, height] = box.split(',').map(Number);
    const file = `${outDir}/contrast-${frameText}.png`;
    await renderStill({ serveUrl, composition, output: file, frame: Number(frameText), imageFormat: 'png', puppeteerInstance: browser, chromiumOptions, overwrite: true });
    const { data, info } = await sharp(file).extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true });
    const lum = [];
    for (let i = 0; i < data.length; i += info.channels) lum.push(relLum(data[i], data[i + 1], data[i + 2]));
    lum.sort((a, b) => a - b);
    const dark = lum[Math.floor(lum.length * 0.05)], light = lum[Math.floor(lum.length * 0.95)];
    contrast.push({ frame: Number(frameText), box, ratio: Number(((light + 0.05) / (dark + 0.05)).toFixed(2)) });
  }
} finally {
  await browser.close({ silent: true });
}

function relLum(r, g, b) {
  const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const files = readdirSync(framesDir).filter((f) => f.endsWith('.jpeg')).sort();
const fps = composition.fps;
const tiles = Array.from({ length: 9 }, () => []);
const mean = [];
for (const f of files) {
  const { data, info } = await sharp(`${framesDir}/${f}`).raw().toBuffer({ resolveWithObject: true });
  const sums = new Array(9).fill(0), counts = new Array(9).fill(0);
  let total = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const l = relLum(data[i], data[i + 1], data[i + 2]);
    const t = Math.min(2, Math.floor((y / info.height) * 3)) * 3 + Math.min(2, Math.floor((x / info.width) * 3));
    sums[t] += l; counts[t]++; total += l;
  }
  sums.forEach((s, t) => tiles[t].push(s / counts[t]));
  mean.push(total / (info.width * info.height));
}

// Reversals: a luminance move of ≥ 0.10 that turns back by ≥ 0.10. Two reversals
// (up-and-back) make one flash, so more than 6 in one second = more than 3 flashes.
function reversals(series) {
  const events = [];
  let dir = 0, lo = series[0], hi = series[0], peak = series[0];
  series.forEach((v, i) => {
    if (dir === 0) {
      if (v - lo >= 0.1) { dir = 1; peak = v; } else if (hi - v >= 0.1) { dir = -1; peak = v; }
      lo = Math.min(lo, v); hi = Math.max(hi, v);
    } else if (dir === 1) {
      if (v > peak) peak = v; else if (peak - v >= 0.1) { events.push(i); dir = -1; peak = v; }
    } else if (v < peak) peak = v; else if (v - peak >= 0.1) { events.push(i); dir = 1; peak = v; }
  });
  return events;
}
const flashFailures = [];
tiles.forEach((series, t) => {
  const ev = reversals(series);
  for (let i = 0; i < ev.length; i++) {
    const inSecond = ev.filter((e) => e >= ev[i] && e < ev[i] + fps).length;
    if (inSecond > 6) { flashFailures.push({ tile: t, frame: ev[i], flashesInOneSecond: inSecond / 2 }); break; }
  }
});
const jumps = [];
for (let i = 0; i + 10 < mean.length; i++) {
  const win = mean.slice(i, i + 11), hi = Math.max(...win), lo = Math.min(...win);
  if ((hi - lo) / Math.max(hi, 0.05) > 0.2) { jumps.push(i); i += 10; }
}

const report = {
  composition: id, frames: files.length, fps,
  luminance: { min: Math.min(...mean).toFixed(3), max: Math.max(...mean).toFixed(3) },
  flashes: flashFailures.length ? flashFailures : 'pass',
  brightnessJumps: jumps.length ? jumps.map((f) => ({ frame: f, note: 'change > 20% within 10 frames; OK only at a marked hard cut' })) : 'pass',
  contrast,
};
writeFileSync(`${outDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (flashFailures.length) process.exitCode = 1;
