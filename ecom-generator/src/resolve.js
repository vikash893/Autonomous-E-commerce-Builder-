const { catalogue } = require('./catalogue');

class BlueprintError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') { super(message); this.code = code; this.status = 400; }
}

// Detect cycles in the whole catalogue (run once at startup).
function assertNoCycles(cat = catalogue) {
  const state = {};
  const visit = (k, path) => {
    if (state[k] === 2) return;
    if (state[k] === 1) throw new Error(`Dependency cycle: ${[...path, k].join(' -> ')}`);
    state[k] = 1;
    (cat[k].dependsOn || []).forEach((d) => visit(d, [...path, k]));
    state[k] = 2;
  };
  Object.keys(cat).forEach((k) => visit(k, []));
}

// Transitive, topologically sorted (deps first), deterministic.
function resolve(selected) {
  const order = Object.keys(catalogue);
  const unknown = selected.filter((k) => !catalogue[k]);
  if (unknown.length) throw new BlueprintError(`Unknown module(s): ${unknown.join(', ')}`);

  const sortedSelected = [...new Set(selected)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const resolved = [];
  const seen = new Set();
  const visit = (k) => {
    if (seen.has(k)) return;
    seen.add(k);
    catalogue[k].dependsOn.forEach(visit);
    resolved.push(k);
  };
  sortedSelected.forEach(visit);

  if (!resolved.includes('products')) {
    throw new BlueprintError('A build needs at least one usable module (select Products).');
  }

  // requiredBy: who pulled each module in
  const requiredBy = {};
  resolved.forEach((m) => catalogue[m].dependsOn.forEach((d) => (requiredBy[d] ||= []).push(m)));
  const autoAdded = resolved
    .filter((m) => !sortedSelected.includes(m))
    .map((m) => ({ module: m, requiredBy: requiredBy[m] || [] }));

  return { resolved, autoAdded };
}

// Fill defaults and validate option values against each module's option schema.
function normalizeOptions(resolved, userOptions = {}) {
  const out = {};
  for (const m of resolved) {
    const schema = catalogue[m].options;
    const given = userOptions[m] || {};
    out[m] = {};
    for (const [name, def] of Object.entries(schema)) {
      const val = given[name] === undefined ? def.default : given[name];
      if (def.type === 'boolean' && typeof val !== 'boolean') throw new BlueprintError(`${m}.${name} must be true/false`);
      if (def.type === 'enum' && !def.values.includes(val)) throw new BlueprintError(`${m}.${name} must be one of: ${def.values.join(', ')}`);
      out[m][name] = val;
    }
    for (const name of Object.keys(given)) {
      if (!schema[name]) throw new BlueprintError(`Unknown option ${m}.${name}`);
    }
  }
  return out;
}

function collectEnvKeys(resolved) {
  const base = [
    { key: 'MONGO_URI', comment: 'MongoDB Atlas connection string (Atlas > Connect > Drivers)', required: true },
    { key: 'PORT', comment: 'Port the API listens on', required: false },
    { key: 'CLIENT_URL', comment: 'Frontend URL allowed by CORS, e.g. http://localhost:5173', required: true },
    { key: 'VITE_API_URL', comment: 'API URL used by the React app', required: true },
  ];
  const all = [...base];
  resolved.forEach((m) => catalogue[m].envKeys.forEach((e) => { if (!all.find((x) => x.key === e.key)) all.push(e); }));
  return all;
}

module.exports = { resolve, normalizeOptions, collectEnvKeys, assertNoCycles, BlueprintError };
