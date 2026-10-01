const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const http = require('http');
const path = require('path');
const { resolve, assertNoCycles } = require('./src/resolve');
const { generate } = require('./src/generate');

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
  const sha = (g) => execSync(`cd ${g.outDir} && find . -type f | sort | xargs cat | sha256sum`).toString();
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
  execSync(`cd ${a.outDir}/server && for f in $(find . -name '*.js'); do node --check $f; done`);
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
  fs.writeFileSync('/tmp/zip-test.zip', zip.buf);
  console.log('zip bytes:', zip.buf.length, execSync('unzip -l /tmp/zip-test.zip | tail -1').toString().trim());
  const bad = await call('POST', '/api/v1/generate', { storeName: 'Q', modules: [] });
  assert.strictEqual(bad.status, 400);
  console.log('validation error shape:', JSON.parse(bad.buf).error.code);
  const again = await call('GET', genJson.data.downloadUrl);
  assert.strictEqual(again.status, 404);
  server.close();
  console.log('\nALL TESTS PASSED');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
