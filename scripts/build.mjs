import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {buildWorkspace} from './build-workspace.mjs';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (url || key) {
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) || !/^sb_publishable_[\w-]+$/.test(key)) {
    throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to the project URL and publishable key.');
  }
}

await rm('dist', {recursive: true, force: true});
await mkdir('dist/assets', {recursive: true});
for (const file of ['index.html', 'app.css', 'manifest.webmanifest']) {
  await cp('pilot/' + file, 'dist/' + file);
}
for (const file of ['chip-in.png', 'chip-in-mark.svg']) {
  await cp('assets/' + file, 'dist/assets/' + file);
}
await build({
  entryPoints: ['pilot/app.js'],
  bundle: true,
  target: 'es2022',
  outfile: 'dist/app.js',
  define: {SUPABASE_URL: JSON.stringify(url), SUPABASE_PUBLISHABLE_KEY: JSON.stringify(key)}
});
await buildWorkspace();
await writeFile('dist/_headers', `/
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' blob:; connect-src 'self' ${url}; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'

/workspace/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
`);
