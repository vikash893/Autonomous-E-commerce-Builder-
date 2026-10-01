const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const { z } = require('zod');
const { catalogue } = require('./catalogue');
const { resolve, normalizeOptions, collectEnvKeys, assertNoCycles } = require('./resolve');
const { generate } = require('./generate');
const { streamZip } = require('./zip');

assertNoCycles(); // reject cyclic catalogues at startup

const app = express();
app.use(cors());
app.use(express.json());

const blueprintSchema = z.object({
  storeName: z.string().min(2).max(60),
  currency: z.string().max(4).optional(),
  theme: z.object({ primary: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).partial().optional(),
  modules: z.array(z.string()).min(1),
  options: z.record(z.record(z.any())).optional(),
});

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

// GET /api/v1/modules -> catalogue that drives the wizard UI
app.get('/api/v1/modules', (req, res) => {
  ok(res, Object.entries(catalogue).map(([key, m]) => ({ key, name: m.name, description: m.description, dependsOn: m.dependsOn, options: m.options })));
});

// POST /api/v1/resolve -> resolved set + autoAdded reasons + env keys (no generation)
app.post('/api/v1/resolve', (req, res, next) => {
  try {
    const { modules, options } = blueprintSchema.pick({ modules: true, options: true }).parse(req.body);
    const { resolved, autoAdded } = resolve(modules);
    normalizeOptions(resolved, options);
    ok(res, { resolved, autoAdded, envKeys: collectEnvKeys(resolved).map((e) => e.key) });
  } catch (e) { next(e); }
});

// POST /api/v1/generate -> builds project in a temp dir, returns a one-time download token
const downloads = new Map();
app.post('/api/v1/generate', async (req, res, next) => {
  try {
    const bp = blueprintSchema.parse(req.body);
    const g = await generate(bp);
    const token = crypto.randomBytes(16).toString('hex');
    downloads.set(token, { dir: g.dir, outDir: g.outDir, name: g.name });
    setTimeout(() => { const d = downloads.get(token); if (d) { fs.remove(d.dir); downloads.delete(token); } }, 10 * 60 * 1000).unref();
    ok(res, { token, downloadUrl: `/api/v1/download/${token}`, fileCount: g.files.length, files: g.files, resolved: g.resolved, autoAdded: g.autoAdded, skippedModules: g.skipped }, 201);
  } catch (e) { next(e); }
});

// GET /api/v1/download/:token -> streams the zip, then deletes the temp dir
app.get('/api/v1/download/:token', (req, res) => {
  const d = downloads.get(req.params.token);
  if (!d) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Download expired or invalid' } });
  downloads.delete(req.params.token);
  streamZip(res, d.outDir, d.name, () => fs.remove(d.dir));
});

// Central error handler: consistent JSON shape, no stack traces
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid blueprint', details: err.issues } });
  const status = err.status || 500;
  res.status(status).json({ success: false, error: { code: err.code || 'SERVER_ERROR', message: status === 500 ? 'Generation failed' : err.message } });
  if (status === 500) console.error(err);
});

if (require.main === module) app.listen(process.env.PORT || 4000, () => console.log('Generator API on :4000'));
module.exports = app;
