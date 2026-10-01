const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const http = require('http');
const path = require('path');
const { resolve, assertNoCycles } = require('./src/resolve');
const { generate } = require('./src/generate');

const crypto = require('crypto');
const os = require('os');

const getFiles = (dir) => {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
};

(async () => {
  assertNoCycles();

  // 1. Dependency resolution
  const r = resolve(['payments']);
  assert.deepStrictEqual(r.resolved.slice(-2), ['orders', 'payments']);
  assert.ok(['auth', 'products', 'cart', 'orders', 'payments'].every((m) => r.resolved.includes(m)));
  console.log('resolve(payments) ->', r.resolved.join(', '));
  console.log('autoAdded ->', JSON.stringify(r.autoAdded));
  assert.throws(() => resolve(['reviews']).resolved && resolve(['bogus']), /Unknown module/);

  // 2. Generate + determinism + options change output
  const bp = { storeName: 'Bloom Boutique', modules: ['products', 'auth'], options: { products: { variants: true, categories: true } } };
  const a = await generate(bp);
  const b = await generate(bp);
  const sha = (g) => {
    const files = getFiles(g.outDir).sort();
    const hash = crypto.createHash('sha256');
    for (const f of files) {
      hash.update(path.relative(g.outDir, f));
      hash.update(fs.readFileSync(f));
    }
    return hash.digest('hex');
  };
  assert.strictEqual(sha(a), sha(b), 'same config must give same output');
  console.log('deterministic: OK; files:', a.files.length);

  const model = fs.readFileSync(path.join(a.outDir, 'server/models/Product.js'), 'utf8');
  assert.ok(model.includes('variants'));
  const c = await generate({ ...bp, options: { products: { variants: false } } });
  assert.ok(!fs.readFileSync(path.join(c.outDir, 'server/models/Product.js'), 'utf8').includes('variants'));
  console.log('options change output: OK');

  // 3. Markers replaced, env example correct, syntax valid
  const idx = fs.readFileSync(path.join(a.outDir, 'server/index.js'), 'utf8');
  assert.ok(idx.includes("/api/v1/products") && idx.includes('/api/v1/auth') && !idx.includes('@mount-routes'));
  console.log(fs.readFileSync(path.join(a.outDir, '.env.example'), 'utf8'));
  const serverFiles = getFiles(path.join(a.outDir, 'server')).filter((f) => f.endsWith('.js'));
  for (const f of serverFiles) {
    execSync(`node --check "${f}"`);
  }
  console.log('server syntax: OK');

  // 4. Invalid combo / failure leaves no temp dir
  await assert.rejects(generate({ storeName: 'X Store', modules: ['admin'] }), /Products/);
  [a, b, c].forEach((g) => fs.removeSync(g.dir));

  // 5. API: generate + stream zip
  const app = require('./src/server');
  const server = app.listen(0);
  const port = server.address().port;
  const call = (method, p, body) => new Promise((res) => {
    const req = http.request({ port, path: p, method, headers: { 'Content-Type': 'application/json' } }, (resp) => {
      const chunks = []; resp.on('data', (d) => chunks.push(d)); resp.on('end', () => res({ status: resp.statusCode, headers: resp.headers, buf: Buffer.concat(chunks) }));
    });
    if (body) req.write(JSON.stringify(body)); req.end();
  });
  const gen = await call('POST', '/api/v1/generate', { storeName: 'Zip Test', modules: ['products', 'auth'] });
  const genJson = JSON.parse(gen.buf);
  assert.strictEqual(gen.status, 201);
  const zip = await call('GET', genJson.data.downloadUrl);
  assert.strictEqual(zip.headers['content-type'], 'application/zip');
  const tmpZip = path.join(os.tmpdir(), 'zip-test.zip');
  fs.writeFileSync(tmpZip, zip.buf);
  console.log('zip bytes:', zip.buf.length);
  const bad = await call('POST', '/api/v1/generate', { storeName: 'Q', modules: [] });
  assert.strictEqual(bad.status, 400);
  console.log('validation error shape:', JSON.parse(bad.buf).error.code);
  const again = await call('GET', genJson.data.downloadUrl);
  assert.strictEqual(again.status, 404);
  server.close();
  console.log('\nALL TESTS PASSED');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
