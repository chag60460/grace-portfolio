import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const project of ['borrowed-wind', 'bellweather-row']) {
  const source = fileURLToPath(new URL(`../../${project}/`, import.meta.url));
  const destination = fileURLToPath(new URL(`../projects/${project}/play/`, import.meta.url));

  execFileSync('npm', [
    'run', 'build', '--',
    '--base=./',
    '--outDir', destination,
    '--emptyOutDir',
  ], { cwd: source, stdio: 'inherit' });

  console.log(`Published local build: projects/${project}/play/index.html`);
}