import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Review these stills visually in addition to the project's build/lint gates.
const directory = 'out/r18-checks';
const checks = [
  ['first', 0],
  ['middle', 300],
  ['last', 599],
  ['bridge', 135],
  ['beacon', 180],
  ['split', 315],
  ['split-enter', 276],
  ['split-exit', 324],
  ['choice', 420],
  ['freeze', 444],
  ['rewind', 588],
  ['rewind-middle', 594],
];

mkdirSync(directory, { recursive: true });
for (const [name, frame] of checks) {
  const result = spawnSync(
    'node',
    [
      'node_modules/@remotion/cli/remotion-cli.js',
      'still',
      'Qissati-R18',
      `${directory}/${name}.png`,
      `--frame=${frame}`,
      '--image-format=png',
      '--gl=angle',
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

writeFileSync(
  `${directory}/frames.json`,
  JSON.stringify({ composition: 'Qissati-R18', fps: 30, checks: checks.map(([name, frame]) => ({ name, frame, seconds: frame / 30, file: `${name}.png` })) }, null, 2) + '\n',
);
