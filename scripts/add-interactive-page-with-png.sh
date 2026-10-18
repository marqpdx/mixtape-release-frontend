#!/usr/bin/env bash
# Generate an artifact PNG and add it to the writing editor's Interactive Page menu.
# See HOW-TO-ADD-INTERACTIVE-PAGES.md beside this script.
set -euo pipefail
interactive_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node - "$interactive_script_dir" "$@" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { spawnSync } = require('node:child_process');

const help = `Usage: bash scripts/add-interactive-page-with-png.sh INPUT.html [options]

INPUT must already be under apps/crossroads/public/artifacts/.
Generates a sibling PNG, then registers the page in the Interactive Page menu.

  --title TEXT    Override the HTML <title> (existing title kept on refresh)
  --id SLUG       Optional unique preset ID for a new page
  --refresh       Refresh an already registered page; does not add a duplicate
  --force         Explicitly permit replacing an existing PNG
  --topology      Crop kit-based maps to their header and diagram
  --selector CSS  Capture one element instead of the full page
  --width NUMBER  Capture viewport width (default 1280)
  --scale NUMBER  Pixel density (default 2)
  --dry-run       Validate and show the plan without changing files
  --help          Show this help

Requires the existing frontend Playwright/Chromium installation and the sibling
puddlejump/zz/html-to-png.sh generator. No installation, commit or deploy is run.`;

function main() {
  const scriptDir = process.argv[2];
  const { values, positionals } = parseArgs({
    args: process.argv.slice(3), allowPositionals: true,
    options: {
      title: { type: 'string' }, id: { type: 'string' },
      refresh: { type: 'boolean' }, force: { type: 'boolean' },
      topology: { type: 'boolean' }, selector: { type: 'string' },
      width: { type: 'string' }, scale: { type: 'string' },
      'dry-run': { type: 'boolean' }, help: { type: 'boolean' },
    },
  });
  if (values.help) { console.log(help); return; }
  if (positionals.length !== 1) throw new Error(help);
  if (values.topology && values.selector) throw new Error('Choose --topology or --selector, not both.');
  if (values.width !== undefined && (!Number.isInteger(Number(values.width)) || Number(values.width) < 320 || Number(values.width) > 7680)) throw new Error('--width must be an integer from 320 to 7680.');
  if (values.scale !== undefined && (!Number.isFinite(Number(values.scale)) || Number(values.scale) < 1 || Number(values.scale) > 4)) throw new Error('--scale must be between 1 and 4.');

  const repo = path.resolve(scriptDir, '..');
  const artifacts = fs.realpathSync(path.join(repo, 'apps/crossroads/public/artifacts'));
  const input = fs.realpathSync(path.resolve(positionals[0]));
  const relative = path.relative(artifacts, input).split(path.sep).join('/');
  if (!fs.statSync(input).isFile() || !/^[a-zA-Z0-9_./-]+\.html?$/.test(relative) || relative.startsWith('../')) {
    throw new Error('Use an HTML file inside apps/crossroads/public/artifacts/ with a URL-safe path.');
  }
  const output = input.replace(/\.html?$/, '.png');
  if (fs.existsSync(output) && !values.force) throw new Error('PNG already exists. Review it, then use --force to replace it.');
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Refusing to replace a PNG symlink.');
  const htmlUrl = `https://www.crossroads.place/artifacts/${relative}`;
  const imageUrl = htmlUrl.replace(/\.html?$/, '.png');

  // Parse the TypeScript literal rather than evaluating code or rewriting other exports.
  const ts = require(require.resolve('typescript', { paths: [repo] }));
  const registry = path.join(repo, 'packages/content/src/topologyArtifacts.ts');
  const original = fs.readFileSync(registry, 'utf8');
  const source = ts.createSourceFile(registry, original, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) throw new Error('Preset registry has syntax errors; no files changed.');
  let list;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'topologyArtifacts') {
      let initializer = node.initializer;
      while (initializer && ts.isAsExpression(initializer)) initializer = initializer.expression;
      if (initializer && ts.isArrayLiteralExpression(initializer)) list = initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!list) throw new Error('Cannot locate the preset array; no files changed.');
  const entries = list.elements.map(node => {
    if (!ts.isObjectLiteralExpression(node)) throw new Error('Expected literal preset objects.');
    const entry = { node };
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) throw new Error('Expected string preset properties.');
      entry[property.name.getText(source)] = property.initializer.text;
    }
    return entry;
  });
  const existing = entries.find(entry => entry.htmlUrl === htmlUrl);
  if (existing && !values.refresh) throw new Error('Page is already registered. Use --refresh --force to regenerate its PNG.');
  if (!existing && values.refresh) throw new Error('Page is not registered; omit --refresh to add it.');
  if (existing && values.id && values.id !== existing.id) throw new Error('Refresh preserves the existing preset ID.');
  const id = existing?.id ?? values.id ?? relative.replace(/\.html?$/, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('--id must start with a lowercase letter and contain only lowercase letters, numbers and hyphens.');
  if (entries.some(entry => entry.id === id && entry !== existing)) throw new Error(`Preset ID already exists: ${id}`);
  if (entries.some(entry => entry.imageUrl === imageUrl && entry !== existing)) throw new Error('Another preset already uses this PNG.');
  if (existing && existing.imageUrl !== imageUrl) throw new Error('Existing preset uses a different image URL; review that entry manually.');

  const html = fs.readFileSync(input, 'utf8');
  const rawTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '';
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  const htmlTitle = rawTitle.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
  const title = (values.title ?? existing?.title ?? htmlTitle).replace(/\s+/g, ' ').trim();
  if (!title || title.length > 160) throw new Error('Supply --title with 1–160 characters.');
  const literal = `  {\n    id: ${JSON.stringify(id)},\n    title: ${JSON.stringify(title)},\n    imageUrl: ${JSON.stringify(imageUrl)},\n    htmlUrl: ${JSON.stringify(htmlUrl)},\n  }`;
  let updated = original;
  if (existing) {
    if (title !== existing.title) updated = original.slice(0, existing.node.getStart(source)) + literal.trimStart() + original.slice(existing.node.end);
  } else {
    const last = list.elements[list.elements.length - 1];
    const insertion = last ? last.end : list.getStart(source) + 1;
    updated = original.slice(0, insertion) + (last ? ',\n' : '\n') + literal + original.slice(insertion);
  }
  const generator = path.resolve(repo, '../puddlejump/zz/html-to-png.sh');
  if (!fs.existsSync(generator)) throw new Error(`PNG generator missing: ${generator}`);
  console.log(`${existing ? 'Refresh' : 'Add'}: ${title} (${id})\nHTML: ${htmlUrl}\nPNG:  ${imageUrl}`);
  if (values['dry-run']) { console.log('Dry run: no files changed.'); return; }
  const args = [generator, input, output];
  for (const flag of ['force', 'topology']) if (values[flag]) args.push(`--${flag}`);
  for (const option of ['selector', 'width', 'scale']) if (values[option] !== undefined) args.push(`--${option}`, values[option]);
  const rendered = spawnSync('bash', args, { stdio: 'inherit' });
  if (rendered.error) throw rendered.error;
  if (rendered.status !== 0) throw new Error('PNG generation failed; preset registry was not changed.');
  if (fs.readFileSync(registry, 'utf8') !== original) throw new Error('Preset registry changed during capture. PNG saved; rerun after reviewing concurrent edits.');
  if (updated !== original) fs.writeFileSync(registry, updated);
  console.log('Ready. Review and commit the HTML, PNG and preset registry. Deploy Crossroads assets and rebuild Mixtape to update the menu.');
}
try { main(); } catch (error) { console.error(`add-interactive-page: ${error.message}`); process.exitCode = 1; }
NODE
