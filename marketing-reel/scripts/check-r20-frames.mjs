import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import sharp from 'sharp';

// Renderer captures for visual review, alongside the project's build/lint gates.
// One bundle and ANGLE browser preserve the same WebGL setup for every check.
const directory = resolve('out/r20-checks');
const checks = [
  ['first', 0],
  ['first-drop', 46],
  ['triptych', 105],
  ['garden', 171],
  ['key', 201],
  ['curiosity', 231],
  ['camera-arc', 270],
  ['doorway-forming', 315],
  ['portal', 363],
  ['blank-slots', 420],
  ['comment-hold', 480],
  ['last', 599],
];
const fps = 30;
const chromiumOptions = { gl: 'angle' };

mkdirSync(directory, { recursive: true });
const serveUrl = await bundle({
  entryPoint: resolve('src/index.jsx'),
  rootDir: process.cwd(),
  rspack: true,
});
const browser = await openBrowser('chrome', { chromiumOptions });

try {
  const composition = await selectComposition({
    serveUrl,
    id: 'Qissati-R20',
    puppeteerInstance: browser,
    chromiumOptions,
  });

  for (const [name, frame] of checks) {
    await renderStill({
      serveUrl,
      composition,
      output: `${directory}/${name}.png`,
      frame,
      imageFormat: 'png',
      puppeteerInstance: browser,
      chromiumOptions,
      overwrite: true,
    });
    console.log(`R20 QC: ${name}, frame ${frame}`);
  }

  const cover = await selectComposition({
    serveUrl,
    id: 'Qissati-R20-Cover',
    puppeteerInstance: browser,
    chromiumOptions,
  });
  await renderStill({
    serveUrl,
    composition: cover,
    output: resolve('out/qissati-r20-cover.png'),
    frame: 0,
    imageFormat: 'png',
    puppeteerInstance: browser,
    chromiumOptions,
    overwrite: true,
  });
} finally {
  await browser.close({ silent: true });
}

writeFileSync(
  `${directory}/frames.json`,
  JSON.stringify({
    composition: 'Qissati-R20',
    fps,
    checks: checks.map(([name, frame]) => ({
      name,
      frame,
      seconds: frame / fps,
      file: `${name}.png`,
    })),
  }, null, 2) + '\n',
);

const columns = 3;
const rows = 4;
const thumbWidth = 270;
const thumbHeight = 480;
const gutter = 12;
const labelHeight = 38;
const cellWidth = thumbWidth + gutter;
const cellHeight = thumbHeight + labelHeight + gutter;
const layers = [];

for (const [index, [name, frame]] of checks.entries()) {
  const left = gutter + (index % columns) * cellWidth;
  const top = gutter + Math.floor(index / columns) * cellHeight;
  const thumbnail = await sharp(`${directory}/${name}.png`)
    .resize(thumbWidth, thumbHeight)
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${thumbWidth}" height="${labelHeight}">`
    + '<rect width="100%" height="100%" fill="#f7f0e5"/>'
    + `<text x="8" y="16" fill="#123f3d" font-family="Arial,sans-serif" font-size="13" font-weight="700">${name}</text>`
    + `<text x="8" y="31" fill="#123f3d" font-family="Arial,sans-serif" font-size="12">Frame ${frame} · ${(frame / fps).toFixed(2)}s</text>`
    + '</svg>',
  );
  layers.push({ input: label, left, top });
  layers.push({ input: thumbnail, left, top: top + labelHeight });
}

await sharp({
  create: {
    width: gutter + columns * cellWidth,
    height: gutter + rows * cellHeight,
    channels: 4,
    background: '#f7f0e5',
  },
}).composite(layers).png().toFile(resolve('out/qissati-r20-contact-sheet.png'));

console.log('R20 cover and 3×4 contact sheet captured.');
