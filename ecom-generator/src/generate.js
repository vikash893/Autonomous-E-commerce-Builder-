const path = require('path');
const os = require('os');
const ejs = require('ejs');
const fs = require('fs-extra');
const prettier = require('prettier');
const { catalogue, ALL_MARKERS } = require('./catalogue');
const { resolve, normalizeOptions, collectEnvKeys } = require('./resolve');

const TEMPLATES = path.join(__dirname, '..', 'templates');
const TEXT_EXT = ['.js', '.jsx', '.json', '.html', '.css', '.md', '.example', '.prettierrc', '.gitignore'];

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out.sort(); // sorted => deterministic
}

// Render one template tree (base/ or modules/<key>/) into outDir.
async function renderTree(srcDir, outDir, ctx) {
  const written = [];
  for (const rel of await walk(srcDir)) {
    const isEjs = rel.endsWith('.ejs');
    const target = path.join(outDir, isEjs ? rel.slice(0, -4) : rel);
    await fs.ensureDir(path.dirname(target));
    if (isEjs) await fs.writeFile(target, ejs.render(await fs.readFile(path.join(srcDir, rel), 'utf8'), ctx, { rmWhitespace: false }));
    else await fs.copy(path.join(srcDir, rel), target);
    written.push(path.relative(outDir, target));
  }
  return written;
}

// Merge pass: replace each marker with the injections of all resolved modules.
async function mergeMarkers(outDir, resolved) {
  const injections = {};
  ALL_MARKERS.forEach((m) => (injections[m] = []));
  resolved.forEach((k) => Object.entries(catalogue[k].inject || {}).forEach(([marker, lines]) => injections[marker].push(...lines)));

  for (const rel of await walk(outDir)) {
    const file = path.join(outDir, rel);
    let text = await fs.readFile(file, 'utf8');
    let changed = false;
    for (const marker of ALL_MARKERS) {
      if (text.includes(marker)) { text = text.split(marker).join(injections[marker].join('\n')); changed = true; }
    }
    if (changed) await fs.writeFile(file, text);
  }
}

function envExample(envKeys) {
  return envKeys.map((e) => `# ${e.comment}${e.required ? ' (required)' : ''}\n${e.key}=`).join('\n\n') + '\n';
}

async function formatOutput(outDir) {
  for (const rel of await walk(outDir)) {
    if (!/\.(js|jsx|json|css|md)$/.test(rel)) continue;
    const file = path.join(outDir, rel);
    try {
      const out = await prettier.format(await fs.readFile(file, 'utf8'), { filepath: file, singleQuote: true });
      await fs.writeFile(file, out);
    } catch (e) {
      throw new Error(`Generated file is invalid (${rel}): ${e.message.split('\n')[0]}`);
    }
  }
}

/**
 * blueprint: { storeName, currency, theme:{primary}, modules:[], options:{} }
 * returns { dir, name, files, resolved, autoAdded, envKeys, skipped } ; caller must remove `dir`.
 */
async function generate(blueprint) {
  const { resolved, autoAdded } = resolve(blueprint.modules);
  const opts = normalizeOptions(resolved, blueprint.options);
  const envKeys = collectEnvKeys(resolved);
  const slug = blueprint.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ecomgen-'));
  const outDir = path.join(dir, slug);
  try {
    const ctx = {
      storeName: blueprint.storeName, slug, currency: blueprint.currency || '₹',
      theme: { primary: '#6366F1', ...(blueprint.theme || {}) },
      modules: resolved, opts, envKeys, has: (k) => resolved.includes(k),
    };
    await fs.ensureDir(outDir);
    await renderTree(path.join(TEMPLATES, 'base'), outDir, ctx);
    const skipped = [];
    for (const key of resolved) {
      const modDir = path.join(TEMPLATES, 'modules', key);
      if (await fs.pathExists(modDir)) await renderTree(modDir, outDir, ctx);
      else skipped.push(key); // module declared but no templates written yet
    }
    await mergeMarkers(outDir, resolved);
    await fs.writeFile(path.join(outDir, '.env.example'), envExample(envKeys));
    await formatOutput(outDir);
    return { dir, outDir, name: slug, files: await walk(outDir), resolved, autoAdded, envKeys, skipped };
  } catch (err) {
    await fs.remove(dir); // never leave partial output behind
    throw err;
  }
}

module.exports = { generate, walk };
