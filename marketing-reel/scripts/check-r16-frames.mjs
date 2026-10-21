import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('out/r16-checks', { recursive: true });
for (const [name, frame] of [['first', 0], ['middle', 330], ['last', 659]]) {
  const result = spawnSync('node', ['node_modules/@remotion/cli/remotion-cli.js', 'still', 'Qissati-R16', `out/r16-checks/${name}.png`, `--frame=${frame}`, '--image-format=png', '--gl=angle'], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const cover = spawnSync('node', ['node_modules/@remotion/cli/remotion-cli.js', 'still', 'Qissati-R16-Cover', 'out/qissati-r16-cover.png', '--image-format=png', '--gl=angle'], { stdio: 'inherit' });
if (cover.status !== 0) process.exit(cover.status ?? 1);
