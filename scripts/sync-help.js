#!/usr/bin/env node
/**
 * sync-help.js
 *
 * Syncs help files from the puddlejump documentation library into this
 * repo's content/help/ directory. Strips the puddlejump governance header
 * (blockquote block + separator line) and passes the remainder through
 * unchanged — including any YAML frontmatter and content.
 *
 * Usage (run from the frontend repo root):
 *   node scripts/sync-help.js
 *
 * Source path can be overridden:
 *   PUDDLEJUMP_HELP=/path/to/puddlejump/help node scripts/sync-help.js
 */

const fs = require('fs');
const path = require('path');

// --- Config ---

const SOURCE_HELP = process.env.PUDDLEJUMP_HELP
  || path.resolve(__dirname, '../../puddlejump/help');

const DEST_HELP = path.resolve(__dirname, '../content/help');

// Directories inside SOURCE_HELP to skip entirely
const SKIP_DIRS = new Set(['_deprecated', '_template']);

// Files at the top level of SOURCE_HELP to skip
const SKIP_FILES = new Set(['README.md']);

// --- Helpers ---

/**
 * Strip the puddlejump governance header from a file's content.
 *
 * The governance header is the block of `>` blockquote lines at the top of
 * the file, the optional blank line after them, and the first standalone
 * `---` separator line. Everything after that separator is returned as-is.
 *
 * Works whether or not the file has YAML frontmatter after the separator.
 */
function stripGovernanceHeader(content) {
  const lines = content.split('\n');
  let i = 0;

  // Skip blockquote lines (lines starting with `>`)
  while (i < lines.length && lines[i].startsWith('>')) {
    i++;
  }

  // Skip any blank lines between blockquote and separator
  while (i < lines.length && lines[i].trim() === '') {
    i++;
  }

  // Skip the first `---` separator
  if (i < lines.length && lines[i].trim() === '---') {
    i++;
  }

  // Skip the blank line immediately after the separator (if any)
  // This keeps the output clean whether there's YAML frontmatter or a heading next
  if (i < lines.length && lines[i].trim() === '') {
    i++;
  }

  return lines.slice(i).join('\n');
}

// --- Main ---

function sync() {
  if (!fs.existsSync(SOURCE_HELP)) {
    console.error(`Source not found: ${SOURCE_HELP}`);
    console.error('Set PUDDLEJUMP_HELP to the correct path and retry.');
    process.exit(1);
  }

  const featureDirs = fs.readdirSync(SOURCE_HELP, { withFileTypes: true })
    .filter(d => d.isDirectory() && !SKIP_DIRS.has(d.name));

  let synced = 0;
  let skipped = 0;

  for (const dir of featureDirs) {
    const srcDir = path.join(SOURCE_HELP, dir.name);
    const destDir = path.join(DEST_HELP, dir.name);

    const files = fs.readdirSync(srcDir, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.md'));

    for (const file of files) {
      const srcFile = path.join(srcDir, file.name);
      const destFile = path.join(destDir, file.name);

      const raw = fs.readFileSync(srcFile, 'utf8');
      const stripped = stripGovernanceHeader(raw);

      if (!stripped.trim()) {
        console.warn(`  skip (empty after strip): ${dir.name}/${file.name}`);
        skipped++;
        continue;
      }

      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, stripped, 'utf8');
      console.log(`  synced: ${dir.name}/${file.name}`);
      synced++;
    }
  }

  console.log(`\nDone. ${synced} file(s) synced, ${skipped} skipped.`);
  console.log(`Output: ${DEST_HELP}`);
}

sync();
