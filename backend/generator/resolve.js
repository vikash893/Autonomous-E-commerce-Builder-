const { catalogue } = require('./catalogue');

class BlueprintError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

// Detect cycles in the whole catalogue
function assertNoCycles(cat = catalogue) {
  const state = {};
  const visit = (k, path) => {
    if (state[k] === 2) return;
    if (state[k] === 1) throw new Error(`Dependency cycle detected: ${[...path, k].join(' -> ')}`);
    state[k] = 1;
    (cat[k].dependsOn || []).forEach((d) => visit(d, [...path, k]));
    state[k] = 2;
  };
  Object.keys(cat).forEach((k) => visit(k, []));
}

// Transitive, topologically sorted dependency resolution
function resolve(selected = []) {
  if (!Array.isArray(selected)) {
    throw new BlueprintError('Modules must be an array of module keys.');
  }

  const order = Object.keys(catalogue);
  const unknown = selected.filter((k) => !catalogue[k]);
  if (unknown.length) {
    throw new BlueprintError(`Unknown module(s): ${unknown.join(', ')}`);
  }

  const sortedSelected = [...new Set(selected)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const resolved = [];
  const seen = new Set();

  const visit = (k) => {
    if (seen.has(k)) return;
    seen.add(k);
    (catalogue[k].dependsOn || []).forEach(visit);
    resolved.push(k);
  };

  sortedSelected.forEach(visit);

  if (!resolved.includes('products')) {
    throw new BlueprintError('A build requires at least the "products" module to generate a working store.');
  }

  // Calculate which module required which auto-added dependency
  const requiredBy = {};
  resolved.forEach((m) => {
    (catalogue[m].dependsOn || []).forEach((d) => {
      requiredBy[d] = requiredBy[d] || [];
      if (!requiredBy[d].includes(m)) requiredBy[d].push(m);
    });
  });

  const autoAdded = resolved
    .filter((m) => !sortedSelected.includes(m))
    .map((m) => ({
      module: m,
      moduleName: catalogue[m].name,
      requiredBy: requiredBy[m] || []
    }));

  return { resolved, autoAdded };
}

// Validate options against option schemas
function normalizeOptions(resolved, userOptions = {}) {
  const out = {};
  for (const m of resolved) {
    const schema = catalogue[m]?.options || {};
    const given = userOptions[m] || {};
    out[m] = {};

    for (const [name, def] of Object.entries(schema)) {
      const val = given[name] === undefined ? def.default : given[name];
      if (def.type === 'boolean' && typeof val !== 'boolean') {
        throw new BlueprintError(`Option "${m}.${name}" must be a boolean.`);
      }
      if (def.type === 'enum' && !def.values.includes(val)) {
        throw new BlueprintError(`Option "${m}.${name}" must be one of: ${def.values.join(', ')}.`);
      }
      out[m][name] = val;
    }
  }
  return out;
}

// Collect all required .env keys
function collectEnvKeys(resolved) {
  const baseKeys = [
    { key: 'MONGO_URI', comment: 'MongoDB connection string (e.g., mongodb://localhost:27017/mystore)', required: true },
    { key: 'PORT', comment: 'Backend API port (default: 5000)', required: false },
    { key: 'CLIENT_URL', comment: 'Frontend client origin for CORS (e.g., http://localhost:5173)', required: true },
    { key: 'VITE_API_URL', comment: 'API URL for the React client (e.g., http://localhost:5000/api/v1)', required: true },
  ];

  const all = [...baseKeys];
  resolved.forEach((m) => {
    (catalogue[m].envKeys || []).forEach((e) => {
      if (!all.find((x) => x.key === e.key)) {
        all.push(e);
      }
    });
  });

  return all;
}

// Build estimated file tree for live preview
function buildEstimatedFileTree(resolved) {
  const files = [
    'package.json',
    'README.md',
    '.env.example',
    '.gitignore',
    '.prettierrc',
    'server/package.json',
    'server/index.js',
    'server/config/db.js',
    'server/scripts/seed.js',
    'client/package.json',
    'client/index.html',
    'client/vite.config.js',
    'client/src/main.jsx',
    'client/src/App.jsx',
    'client/src/api.js',
    'client/src/index.css'
  ];

  if (resolved.includes('products')) {
    files.push(
      'server/models/Product.js',
      'server/models/Category.js',
      'server/routes/product.routes.js',
      'client/src/pages/Products.jsx',
      'client/src/pages/ProductDetail.jsx'
    );
  }
  if (resolved.includes('auth')) {
    files.push(
      'server/models/User.js',
      'server/routes/auth.routes.js',
      'server/middlewares/auth.middleware.js',
      'client/src/pages/Login.jsx',
      'client/src/pages/Signup.jsx',
      'client/src/pages/Dashboard.jsx'
    );
  }
  if (resolved.includes('cart')) {
    files.push(
      'server/models/Cart.js',
      'server/routes/cart.routes.js',
      'client/src/pages/Cart.jsx'
    );
  }
  if (resolved.includes('orders')) {
    files.push(
      'server/models/Order.js',
      'server/routes/order.routes.js',
      'client/src/pages/Checkout.jsx',
      'client/src/pages/Orders.jsx'
    );
  }
  if (resolved.includes('payments')) {
    files.push(
      'server/routes/payment.routes.js',
      'client/src/pages/PaymentSuccess.jsx'
    );
  }
  if (resolved.includes('admin')) {
    files.push(
      'server/routes/admin.routes.js',
      'client/src/pages/admin/AdminDashboard.jsx',
      'client/src/pages/admin/AdminProducts.jsx',
      'client/src/pages/admin/AdminOrders.jsx'
    );
  }
  if (resolved.includes('reviews')) {
    files.push(
      'server/models/Review.js',
      'server/routes/review.routes.js'
    );
  }
  if (resolved.includes('coupons')) {
    files.push(
      'server/models/Coupon.js',
      'server/routes/coupon.routes.js'
    );
  }
  if (resolved.includes('wishlist')) {
    files.push(
      'server/models/Wishlist.js',
      'server/routes/wishlist.routes.js',
      'client/src/pages/Wishlist.jsx'
    );
  }
  if (resolved.includes('search')) {
    files.push(
      'server/routes/search.routes.js'
    );
  }

  return files.sort();
}

module.exports = {
  resolve,
  normalizeOptions,
  collectEnvKeys,
  buildEstimatedFileTree,
  assertNoCycles,
  BlueprintError
};
