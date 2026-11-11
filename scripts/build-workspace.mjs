import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

export async function buildWorkspace() {
  const output = 'dist/workspace/';
  await mkdir(output, {recursive: true});
  await writeFile(output + 'bridge.js', await readFile('pilot/legacy/bridge.js'));
  for (const entry of ['index.html', 'rota-app.html']) {
    const files = new Set();
    let html = (await readFile(entry, 'utf8'))
      .replaceAll('https://cdn.jsdelivr.net/gh/ChipButt/Test@Rota-App/', 'vendor/rota/')
      .replace(/<script src="(?:https:[^"]+|workspace-backup\.js)"[^>]*><\/script>/g, '')
      .replace(/<script src="([^"]+)"[^>]*><\/script>/g, (_, url) => {
        files.add(url.split('?')[0]);
        return `<template data-workspace-script="${url}"></template>`;
      })
      .replace(/<link\b[^>]*rel="manifest"[^>]*>/g, '')
      .replace(/((?:src|srcset|href)=")assets\//g, '$1../assets/')
      .replace(/<button id="(?:export-workspace|installBtn)"[^>]*>[^<]*<\/button>/g, '');
    for (const [, url] of html.matchAll(/<link\b[^>]*href="([^"]+\.css(?:\?[^"]*)?)"/g)) {
      if (!url.startsWith('https:')) files.add(url.split('?')[0]);
    }
    for (const file of files) {
      let source = await readFile(file, 'utf8');
      if (file.endsWith('.js')) {
        source = source.replace(/\blocalStorage\b/g, 'window.workspaceStorage');
      }
      if (file === 'app.js') {
        source = source.replace(/^.*navigator\.serviceWorker.*$/gm, '');
      }
      if (file === 'rota-bridge.js') {
        source = source.replace('ROTA_NAMES.map(rotaMakeUser)', 'state.users')
          .replace("state.users.find(u => u.name === 'Chip Butt')?.id || state.users[0]?.id",
            'state.users.find(u => u.id === state.currentUser)?.id || state.users[0]?.id')
          .replace("rotaIdFromName('Chip Butt');", 'state.currentUser;')
          .replace("ru.role === 'admin'", "String(ru.role).toLowerCase() === 'admin'")
          .replace(/const ROTA_NAMES = .*;\n/, '')
          .replace(/const ROTA_MANAGERS = .*;/, 'const ROTA_MANAGERS = [];')
          .replace(/email: name === .*?,/, "email: '',");
      }
      await mkdir(dirname(output + file), {recursive: true});
      await writeFile(output + file, source);
    }
    html = html.replace('</body>', '<script src="bridge.js"></script>\n</body>');
    await writeFile(output + entry, html);
  }
}
