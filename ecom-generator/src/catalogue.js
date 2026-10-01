// The module catalogue: dependencies, options, env keys, and what each module injects at markers.
const catalogue = {
  auth: {
    name: 'Auth', description: 'Signup/login with JWT and roles',
    dependsOn: [],
    options: { strategy: { type: 'enum', values: ['jwt'], default: 'jwt' } },
    envKeys: [{ key: 'JWT_SECRET', comment: 'Long random string used to sign login tokens', required: true }],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/auth', require('./routes/auth.routes'));"],
      '// @client-imports': ["import Login from './pages/Login';"],
      '{/* @nav-links */}': ['<Link to="/login">Login</Link>'],
      '{/* @routes */}': ['<Route path="/login" element={<Login />} />'],
      '// @seed-imports': ["const User = require('../models/User');", "const bcrypt = require('bcryptjs');"],
      '// @seed-run': [
        "await User.deleteMany({});",
        "await User.create({ name: 'Admin', email: 'admin@demo.com', password: await bcrypt.hash('Admin@123', 10), role: 'ADMIN' });",
      ],
    },
  },
  products: {
    name: 'Products', description: 'Product catalogue with listing and admin CRUD',
    dependsOn: [],
    options: {
      categories: { type: 'boolean', default: true },
      variants: { type: 'boolean', default: false },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/products', require('./routes/product.routes'));"],
      '// @client-imports': ["import Products from './pages/Products';"],
      '{/* @nav-links */}': ['<Link to="/">Products</Link>'],
      '{/* @routes */}': ['<Route path="/" element={<Products />} />'],
      '// @seed-imports': ["const Product = require('../models/Product');"],
      '// @seed-run': [
        "await Product.deleteMany({});",
        "await Product.insertMany([{ name: 'Classic Tee', price: 499, stock: 50, category: 'Clothing', description: 'Soft cotton tee' }, { name: 'Canvas Tote', price: 299, stock: 30, category: 'Bags', description: 'Everyday tote' }, { name: 'Steel Bottle', price: 649, stock: 20, category: 'Home', description: '750ml bottle' }]);",
      ],
    },
  },
  // Dependencies are declared; add templates/modules/<key>/ to make them generate real files.
  cart: { name: 'Cart', description: 'Shopping cart', dependsOn: ['products'], options: { guestCart: { type: 'boolean', default: false } }, envKeys: [], inject: {} },
  orders: { name: 'Orders', description: 'Checkout and order history', dependsOn: ['cart', 'products', 'auth'], options: {}, envKeys: [], inject: {} },
  payments: {
    name: 'Payments', description: 'Razorpay / Stripe (test mode)', dependsOn: ['orders'],
    options: { provider: { type: 'enum', values: ['razorpay', 'stripe'], default: 'razorpay' } },
    envKeys: [
      { key: 'RAZORPAY_KEY_ID', comment: 'Razorpay dashboard > Settings > API Keys (test mode)', required: true },
      { key: 'RAZORPAY_KEY_SECRET', comment: 'Same page as the key id', required: true },
    ],
    inject: {},
  },
  admin: { name: 'Admin dashboard', description: 'Admin panel for managing resources', dependsOn: ['auth'], options: {}, envKeys: [], inject: {} },
  reviews: { name: 'Reviews', description: 'Product reviews and ratings', dependsOn: ['products', 'auth'], options: {}, envKeys: [], inject: {} },
};

// Every marker the base templates contain. Unused ones are stripped in the merge pass.
const ALL_MARKERS = ['// @mount-routes', '// @client-imports', '{/* @nav-links */}', '{/* @routes */}', '// @seed-imports', '// @seed-run'];

module.exports = { catalogue, ALL_MARKERS };
