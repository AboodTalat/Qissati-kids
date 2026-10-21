import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import sharp from 'sharp';

// Visual QC captures, reviewed alongside the project's build/lint gates.
// Reuse one bundle and ANGLE browser for the complete still set.
const directory = resolve('out/r19-checks');
const checks = [
  ['first', 0],
  ['first-ripple', 36],
  ['third-ripple', 90],
  ['rain', 150],
  ['match-cut', 210],
  ['paper-steps', 285],
  ['question', 330],
  ['both-worlds', 420],
  ['return-ripple', 510],
  ['last', 569],
];
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
    id: 'Qissati-R19',
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
    console.log(`R19 QC: ${name}, frame ${frame}`);
  }

  const cover = await selectComposition({
    serveUrl,
    id: 'Qissati-R19-Cover',
    puppeteerInstance: browser,
    chromiumOptions,
  });
  await renderStill({
    serveUrl,
    composition: cover,
    output: resolve('out/qissati-r19-cover.png'),
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
    composition: 'Qissati-R19',
    fps: 30,
    checks: checks.map(([name, frame]) => ({
      name,
      frame,
      seconds: frame / 30,
      file: `${name}.png`,
    })),
  }, null, 2) + '\n',
);

const thumbWidth = 270;
const thumbHeight = 480;
const gutter = 12;
const labelHeight = 38;
const cellWidth = thumbWidth + gutter;
const cellHeight = thumbHeight + labelHeight + gutter;
const layers = [];
for (const [index, [name, frame]] of checks.entries()) {
  const left = gutter + (index % 2) * cellWidth;
  const top = gutter + Math.floor(index / 2) * cellHeight;
  const thumbnail = await sharp(`${directory}/${name}.png`)
    .resize(thumbWidth, thumbHeight)
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${thumbWidth}" height="${labelHeight}">`
    + '<rect width="100%" height="100%" fill="#f7f0e5"/>'
    + `<text x="8" y="16" fill="#123f3d" font-family="Arial,sans-serif" font-size="13" font-weight="700">${name}</text>`
    + `<text x="8" y="31" fill="#123f3d" font-family="Arial,sans-serif" font-size="12">Frame ${frame} · ${(frame / 30).toFixed(2)}s</text>`
    + '</svg>',
  );
  layers.push({ input: label, left, top });
  layers.push({ input: thumbnail, left, top: top + labelHeight });
}
await sharp({
  create: {
    width: gutter + 2 * cellWidth,
    height: gutter + 5 * cellHeight,
    channels: 4,
    background: '#f7f0e5',
  },
}).composite(layers).png().toFile(resolve('out/qissati-r19-contact-sheet.png'));
console.log('R19 cover and 2×5 contact sheet captured.');
