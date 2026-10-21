import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import sharp from 'sharp';

// Visual inspection captures, not a test runner. One bundle and ANGLE browser
// keep all four reels on the same rendering path as their Studio exports.
const specs = [
  { reel: 'R21', title: 'A little detail · a big adventure', frames: [0, 150, 255, 345, 435, 599] },
  { reel: 'R22', title: 'A moonlit question', frames: [0, 120, 225, 315, 435, 539] },
  { reel: 'R23', title: 'A gift that opens a story', frames: [0, 150, 255, 300, 315, 345, 435, 599] },
  { reel: 'R24', title: 'Choose an adventure', frames: [0, 135, 195, 255, 375, 599] },
];
const selected = process.argv.slice(2);
const captures = selected.length ? specs.filter(spec => selected.includes(spec.reel)) : specs;
if (!captures.length) throw new Error('Use R21, R22, R23 or R24 as optional capture arguments.');
const chromiumOptions = { gl: 'angle' };
const serveUrl = await bundle({ entryPoint: resolve('src/index.jsx'), rootDir: process.cwd(), rspack: true });
const browser = await openBrowser('chrome', { chromiumOptions });
const warnings = new Set();
try {
  for (const spec of captures) {
    const directory = resolve(`out/${spec.reel.toLowerCase()}-checks`);
    mkdirSync(directory, { recursive: true });
    const composition = await selectComposition({ serveUrl, id: `Qissati-${spec.reel}`, puppeteerInstance: browser, chromiumOptions });
    for (const [index, frame] of spec.frames.entries()) {
      await renderStill({ serveUrl, composition, output: `${directory}/${index === 0 ? 'first' : index === spec.frames.length - 1 ? 'last' : `frame-${frame}`}.png`, frame, imageFormat: 'png', puppeteerInstance: browser, chromiumOptions, overwrite: true,
        onBrowserLog: ({ type, text }) => { if (type === 'error') throw new Error(`${spec.reel}: ${text}`); if (type === 'warning') warnings.add(text); } });
      console.log(`${spec.reel}: inspected capture frame ${frame}`);
    }
    const cover = await selectComposition({ serveUrl, id: `Qissati-${spec.reel}-Cover`, puppeteerInstance: browser, chromiumOptions });
    await renderStill({ serveUrl, composition: cover, output: resolve(`out/qissati-${spec.reel.toLowerCase()}-cover.png`), frame: 0, imageFormat: 'png', puppeteerInstance: browser, chromiumOptions, overwrite: true });
    writeFileSync(`${directory}/frames.json`, JSON.stringify({ composition: composition.id, fps: 30, durationInFrames: composition.durationInFrames, frames: spec.frames }, null, 2) + '\n');
    const layers = [];
    for (const [index, frame] of spec.frames.entries()) {
      const name = index === 0 ? 'first' : index === spec.frames.length - 1 ? 'last' : `frame-${frame}`;
      const x = 12 + index % 3 * 282, y = 12 + Math.floor(index / 3) * 522;
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="270" height="30"><rect width="270" height="30" fill="#f4edde"/><text x="9" y="21" font-family="Arial" font-size="14" fill="#123f3d">${spec.reel} · ${frame}f · ${(frame / 30).toFixed(2)}s</text></svg>`);
      layers.push({ input: label, left: x, top: y });
      layers.push({ input: await sharp(`${directory}/${name}.png`).resize(270, 480).png().toBuffer(), left: x, top: y + 30 });
    }
    await sharp({ create: { width: 858, height: 12 + Math.ceil(spec.frames.length / 3) * 522, channels: 4, background: '#f4edde' } }).composite(layers).png().toFile(resolve(`out/qissati-${spec.reel.toLowerCase()}-contact-sheet.png`));
  }
} finally {
  await browser.close({ silent: true });
}
if (warnings.size) console.log(`Browser warnings: ${[...warnings].join(' | ')}`);

// Refresh the overview from all latest covers after a partial recapture too.
if (specs.every(spec => existsSync(resolve(`out/qissati-${spec.reel.toLowerCase()}-cover.png`)))) {
  const layers = [];
  for (const [index, spec] of specs.entries()) {
    const left = 18 + index % 2 * 378, top = 18 + Math.floor(index / 2) * 687;
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="29"><rect width="360" height="29" fill="#f4edde"/><text x="10" y="21" font-family="Arial" font-size="14" fill="#123f3d">${spec.reel} · ${spec.title}</text></svg>`);
    layers.push({ input: label, left, top });
    layers.push({ input: await sharp(resolve(`out/qissati-${spec.reel.toLowerCase()}-cover.png`)).resize(360, 640).png().toBuffer(), left, top: top + 29 });
  }
  await sharp({ create: { width: 774, height: 1392, channels: 4, background: '#f4edde' } }).composite(layers).png().toFile(resolve('out/qissati-four-reels-preview.png'));
}
console.log('Visual capture set complete.');
