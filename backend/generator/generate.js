const path = require('path');
const os = require('os');
const ejs = require('ejs');
const fs = require('fs-extra');
const prettier = require('prettier');
const { catalogue, ALL_MARKERS } = require('./catalogue');
const { resolve, normalizeOptions, collectEnvKeys } = require('./resolve');

const TEMPLATES = path.join(__dirname, '..', 'templates');

async function walk(dir, base = dir) {
  const out = [];
  if (!(await fs.pathExists(dir))) return out;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out.sort();
}

async function renderTree(srcDir, outDir, ctx) {
  const written = [];
  if (!(await fs.pathExists(srcDir))) return written;

  for (const rel of await walk(srcDir)) {
    const isEjs = rel.endsWith('.ejs');
    const target = path.join(outDir, isEjs ? rel.slice(0, -4) : rel);
    await fs.ensureDir(path.dirname(target));

    if (isEjs) {
      const templateContent = await fs.readFile(path.join(srcDir, rel), 'utf8');
      const rendered = ejs.render(templateContent, ctx, { rmWhitespace: false });
      await fs.writeFile(target, rendered, 'utf8');
    } else {
      await fs.copy(path.join(srcDir, rel), target);
    }
    written.push(path.relative(outDir, target));
  }
  return written;
}

async function mergeMarkers(outDir, resolved) {
  const injections = {};
  ALL_MARKERS.forEach((m) => (injections[m] = []));

  resolved.forEach((k) => {
    const moduleDef = catalogue[k] || {};
    Object.entries(moduleDef.inject || {}).forEach(([marker, lines]) => {
      if (injections[marker]) {
        injections[marker].push(...lines);
      }
    });
  });

  for (const rel of await walk(outDir)) {
    const file = path.join(outDir, rel);
    if (!(await fs.pathExists(file))) continue;
    let text = await fs.readFile(file, 'utf8');
    let changed = false;

    for (const marker of ALL_MARKERS) {
      if (text.includes(marker)) {
        const replacement = injections[marker].join('\n');
        text = text.split(marker).join(replacement);
        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(file, text, 'utf8');
    }
  }
}

function generateEnvExample(envKeys) {
  return (
    '# ====================================================\n' +
    '# Autonomous E-commerce Store Environment Configuration\n' +
    '# Copy this file to .env and fill in your values\n' +
    '# ====================================================\n\n' +
    envKeys
      .map(
        (e) =>
          `# ${e.comment}${e.required ? ' (REQUIRED)' : ' (OPTIONAL)'}\n${e.key}=`
      )
      .join('\n\n') +
    '\n'
  );
}

function generatePrefilledEnv(envKeys, slug) {
  const defaultValues = {
    MONGO_URI: `mongodb://127.0.0.1:27017/${slug}`,
    PORT: '5000',
    CLIENT_URL: 'http://localhost:5173',
    VITE_API_URL: 'http://localhost:5000/api/v1',
    JWT_SECRET: `super_secret_jwt_key_${slug}_2026`,
    RAZORPAY_KEY_ID: 'rzp_test_sample',
    RAZORPAY_KEY_SECRET: 'rzp_test_secret',
  };

  return (
    '# ====================================================\n' +
    '# Autonomous E-commerce Store Pre-configured .env\n' +
    '# Pre-filled with working local development defaults\n' +
    '# ====================================================\n\n' +
    envKeys
      .map((e) => {
        const val = defaultValues[e.key] || 'sample_value';
        return `# ${e.comment}\n${e.key}=${val}`;
      })
      .join('\n\n') +
    '\n'
  );
}

async function formatOutput(outDir) {
  for (const rel of await walk(outDir)) {
    if (!/\.(js|jsx|json|css|md)$/.test(rel)) continue;
    const file = path.join(outDir, rel);
    try {
      const content = await fs.readFile(file, 'utf8');
      const formatted = await prettier.format(content, {
        filepath: file,
        singleQuote: true,
      });
      await fs.writeFile(file, formatted, 'utf8');
    } catch {
      // If formatting fails on a dynamic snippet, keep raw file
    }
  }
}

/**
 * Generates the complete MERN project in a temporary folder.
 * blueprint: { storeName, currency, theme: { primary }, modules: [], options: {} }
 */
async function generate(blueprint) {
  const storeName = blueprint.storeName || 'My Store';
  const { resolved, autoAdded } = resolve(blueprint.modules || ['products']);
  const opts = normalizeOptions(resolved, blueprint.options || {});
  const envKeys = collectEnvKeys(resolved);
  const slug =
    storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'store';

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ecomgen-'));
  const outDir = path.join(tempDir, slug);

  try {
    const rawCurrency = blueprint.currency;
    const currency = (!rawCurrency || rawCurrency === '?' || rawCurrency === 'undefined') ? '₹' : rawCurrency;

    const ctx = {
      storeName,
      slug,
      currency,
      theme: { primary: '#6366F1', ...(blueprint.theme || {}) },
      modules: resolved,
      opts,
      envKeys,
      has: (k) => resolved.includes(k),
    };

    await fs.ensureDir(outDir);

    // 1. Render base templates
    await renderTree(path.join(TEMPLATES, 'base'), outDir, ctx);

    // 2. Render module specific templates
    const skipped = [];
    for (const key of resolved) {
      const modDir = path.join(TEMPLATES, 'modules', key);
      if (await fs.pathExists(modDir)) {
        await renderTree(modDir, outDir, ctx);
      } else {
        skipped.push(key);
      }
    }

    // 3. Merge markers across files
    await mergeMarkers(outDir, resolved);

    // 4. Write BOTH .env (pre-filled with working local defaults) AND .env.example
    const prefilledEnv = generatePrefilledEnv(envKeys, slug);
    const envExample = generateEnvExample(envKeys);
    await fs.writeFile(path.join(outDir, '.env'), prefilledEnv, 'utf8');
    await fs.writeFile(path.join(outDir, '.env.example'), envExample, 'utf8');

    // Also write into server/.env and client/.env for direct folder execution
    if (await fs.pathExists(path.join(outDir, 'server'))) {
      await fs.writeFile(path.join(outDir, 'server', '.env'), prefilledEnv, 'utf8');
      await fs.writeFile(path.join(outDir, 'server', '.env.example'), envExample, 'utf8');
    }
    if (await fs.pathExists(path.join(outDir, 'client'))) {
      await fs.writeFile(
        path.join(outDir, 'client', '.env'),
        `VITE_API_URL=http://localhost:5000/api/v1\n`,
        'utf8'
      );
      await fs.writeFile(
        path.join(outDir, 'client', '.env.example'),
        `VITE_API_URL=http://localhost:5000/api/v1\n`,
        'utf8'
      );
    }

    // 5. Run prettier formatter
    await formatOutput(outDir);

    const files = await walk(outDir);

    return {
      tempDir,
      outDir,
      name: slug,
      files,
      resolved,
      autoAdded,
      envKeys,
      skipped,
    };
  } catch (err) {
    await fs.remove(tempDir).catch(() => {});
    throw err;
  }
}

module.exports = { generate, walk };
