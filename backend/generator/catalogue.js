// Complete Module Catalogue for Autonomous E-Commerce Builder (Code Generator)
// Supports all P0, P1, and P2 modules with dependency graph, options, envKeys, and marker injections.

const catalogue = {
  products: {
    key: 'products',
    name: 'Products & Catalog',
    description: 'Product listing, categories, variants, inventory, and detailed product pages.',
    icon: '📦',
    category: 'Core',
    dependsOn: [],
    options: {
      categories: { type: 'boolean', default: true, description: 'Enable product categories' },
      variants: { type: 'boolean', default: false, description: 'Enable sizes/colors variants' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/products', require('./routes/product.routes'));"],
      '// @client-imports': [
        "import Products from './pages/Products';",
        "import ProductDetail from './pages/ProductDetail';"
      ],
      '{/* @nav-links */}': ['<Link to="/" className="nav-link">Products</Link>'],
      '{/* @routes */}': [
        '<Route path="/" element={<Products />} />',
        '<Route path="/products/:id" element={<ProductDetail />} />'
      ],
      '// @seed-imports': ["const Product = require('../models/Product');"],
      '// @seed-run': [
        "await Product.deleteMany({});",
        `await Product.insertMany([
          { name: 'Minimalist Cotton Tee', price: 499, stock: 50, category: 'Clothing', description: 'Premium 100% organic cotton breathable tee.' },
          { name: 'Canvas Everyday Tote', price: 299, stock: 30, category: 'Accessories', description: 'Durable eco-friendly canvas tote bag with reinforced handles.' },
          { name: 'Insulated Steel Bottle 750ml', price: 649, stock: 25, category: 'Lifestyle', description: 'Double-walled vacuum insulated stainless steel water bottle.' },
          { name: 'Leather Minimalist Wallet', price: 899, stock: 15, category: 'Accessories', description: 'Slim bifold full-grain leather wallet with RFID protection.' }
        ]);`
      ],
    },
  },

  cart: {
    key: 'cart',
    name: 'Shopping Cart',
    description: 'Interactive cart state, item quantities, total calculations, and mini-cart drawer.',
    icon: '🛒',
    category: 'Core',
    dependsOn: ['products', 'auth'],
    options: {
      guestCart: { type: 'boolean', default: true, description: 'Allow guest users to add items to cart' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/cart', require('./routes/cart.routes'));"],
      '// @client-imports': ["import Cart from './pages/Cart';"],
      '{/* @nav-links */}': ['{user?.role !== "ADMIN" && (<Link to="/cart" className="nav-link">Cart</Link>)}'],
      '{/* @routes */}': ['<Route path="/cart" element={<Cart />} />'],
      '// @seed-imports': [],
      '// @seed-run': [],
    },
  },

  auth: {
    key: 'auth',
    name: 'Authentication & Roles',
    description: 'User signup, login, JWT token auth, bcrypt password hashing, and user roles.',
    icon: '🔐',
    category: 'Security',
    dependsOn: [],
    options: {
      strategy: { type: 'enum', values: ['jwt'], default: 'jwt', description: 'Auth token strategy' },
    },
    envKeys: [
      { key: 'JWT_SECRET', comment: 'Cryptographic secret key for signing user authentication tokens', required: true }
    ],
    inject: {
      '// @global-middleware': ["app.use(require('./middlewares/auth').optionalAuth);"],
      '// @mount-routes': ["app.use('/api/v1/auth', require('./routes/auth.routes'));"],
      '// @client-imports': [
        "import Login from './pages/Login';",
        "import Signup from './pages/Signup';",
        "import Dashboard from './pages/Dashboard';"
      ],
      '{/* @nav-links */}': [
        '{!user && (<><Link to="/login" className="nav-link">Login</Link><Link to="/signup" className="nav-link">Signup</Link></>)}',
        '{user && user.role !== "ADMIN" && (<Link to="/dashboard" className="nav-link">🎓 My Dashboard</Link>)}'
      ],
      '{/* @routes */}': [
        '<Route path="/login" element={<Login />} />',
        '<Route path="/signup" element={<Signup />} />',
        '<Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />'
      ],
      '// @seed-imports': [
        "const User = require('../models/User');",
        "const bcrypt = require('bcryptjs');"
      ],
      '// @seed-run': [
        "await User.deleteMany({});",
        "await User.create({ name: 'Store Admin', email: 'admin@demo.com', password: await bcrypt.hash('Admin@123', 10), role: 'ADMIN' });",
        "await User.create({ name: 'Demo Shopper', email: 'customer@demo.com', password: await bcrypt.hash('Customer@123', 10), role: 'USER' });"
      ],
    },
  },

  orders: {
    key: 'orders',
    name: 'Orders & Checkout',
    description: 'Complete checkout flow, order creation, order history, tracking, and invoice statuses.',
    icon: '📋',
    category: 'Sales',
    dependsOn: ['cart', 'products', 'auth'],
    options: {
      invoices: { type: 'boolean', default: true, description: 'Generate downloadable invoices' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/orders', require('./routes/order.routes'));"],
      '// @client-imports': [
        "import Checkout from './pages/Checkout';",
        "import Orders from './pages/Orders';"
      ],
      '{/* @nav-links */}': [
        '{user?.role !== "ADMIN" && (<Link to="/orders" className="nav-link">Orders</Link>)}'
      ],
      '{/* @routes */}': [
        '<Route path="/checkout" element={<Checkout />} />',
        '<Route path="/orders" element={<Orders />} />'
      ],
      '// @seed-imports': ["const Order = require('../models/Order');"],
      '// @seed-run': ["await Order.deleteMany({});"],
    },
  },

  payments: {
    key: 'payments',
    name: 'Payment Gateway',
    description: 'Real Razorpay checkout with test-mode order creation, signature verification, and payment tracking.',
    icon: '💳',
    category: 'Sales',
    dependsOn: ['orders'],
    options: {
      provider: { type: 'enum', values: ['razorpay'], default: 'razorpay', description: 'Payment processor' },
    },
    envKeys: [
      { key: 'RAZORPAY_KEY_ID', comment: 'Razorpay Dashboard > Settings > API Keys (Test Key ID: rzp_test_xxx)', required: true },
      { key: 'RAZORPAY_KEY_SECRET', comment: 'Razorpay Dashboard > API Key Secret', required: true }
    ],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/payments', require('./routes/payment.routes'));"],
      '// @client-imports': ["import PaymentSuccess from './pages/PaymentSuccess';"],
      '{/* @nav-links */}': [],
      '{/* @routes */}': ['<Route path="/payment/success" element={<PaymentSuccess />} />'],
      '// @seed-imports': [],
      '// @seed-run': [],
    },
  },

  admin: {
    key: 'admin',
    name: 'Admin Dashboard',
    description: 'Full store administration panel: product management, inventory controls, order updates, and KPIs.',
    icon: '🛡️',
    category: 'Management',
    dependsOn: ['auth', 'products'],
    options: {
      analytics: { type: 'boolean', default: true, description: 'Display sales & revenue metrics' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/admin', require('./routes/admin.routes'));"],
      '// @client-imports': [
        "import AdminDashboard from './pages/admin/AdminDashboard';",
        "import AdminProducts from './pages/admin/AdminProducts';",
        "import AdminOrders from './pages/admin/AdminOrders';"
      ],
      '{/* @nav-links */}': [
        '{user?.role === "ADMIN" && (<><Link to="/admin" className="nav-link admin-nav-badge">🛡️ Admin Dashboard</Link><Link to="/admin/products" className="nav-link">📦 Products (CRUD)</Link><Link to="/admin/orders" className="nav-link">📋 Orders</Link></>)}'
      ],
      '{/* @routes */}': [
        '<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />',
        '<Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />',
        '<Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />'
      ],
      '// @seed-imports': [],
      '// @seed-run': [],
    },
  },

  reviews: {
    key: 'reviews',
    name: 'Customer Reviews & Ratings',
    description: 'Product customer ratings, 1-5 star reviews, and moderation capabilities.',
    icon: '⭐',
    category: 'Social',
    dependsOn: ['products', 'auth'],
    options: {
      moderation: { type: 'boolean', default: false, description: 'Auto-approve or require admin moderation' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/reviews', require('./routes/review.routes'));"],
      '// @client-imports': [],
      '{/* @nav-links */}': [],
      '{/* @routes */}': [],
      '// @seed-imports': ["const Review = require('../models/Review');"],
      '// @seed-run': ["await Review.deleteMany({});"],
    },
  },

  coupons: {
    key: 'coupons',
    name: 'Coupons & Discounts',
    description: 'Promotional discount codes, percentage/flat discounts, and minimum order limits.',
    icon: '🏷️',
    category: 'Marketing',
    dependsOn: ['orders'],
    options: {
      discountType: { type: 'enum', values: ['percentage', 'flat'], default: 'percentage', description: 'Default discount calculation' },
    },
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/coupons', require('./routes/coupon.routes'));"],
      '// @client-imports': [],
      '{/* @nav-links */}': [],
      '{/* @routes */}': [],
      '// @seed-imports': ["const Coupon = require('../models/Coupon');"],
      '// @seed-run': [
        "await Coupon.deleteMany({});",
        "await Coupon.create({ code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 500, isActive: true });",
        "await Coupon.create({ code: 'FLAT100', discount: 100, type: 'flat', minOrder: 1000, isActive: true });"
      ],
    },
  },

  wishlist: {
    key: 'wishlist',
    name: 'Wishlist & Saved Items',
    description: 'Allow customers to bookmark and save favorite products to their personal wishlist.',
    icon: '💖',
    category: 'Engagement',
    dependsOn: ['products', 'auth'],
    options: {},
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/wishlist', require('./routes/wishlist.routes'));"],
      '// @client-imports': ["import Wishlist from './pages/Wishlist';"],
      '{/* @nav-links */}': ['{user?.role !== "ADMIN" && (<Link to="/wishlist" className="nav-link">Wishlist</Link>)}'],
      '{/* @routes */}': ['<Route path="/wishlist" element={<Wishlist />} />'],
      '// @seed-imports': [],
      '// @seed-run': [],
    },
  },

  search: {
    key: 'search',
    name: 'Advanced Search & Filter',
    description: 'Full-text product search, price range filtering, category facets, and sorting.',
    icon: '🔍',
    category: 'Discovery',
    dependsOn: ['products'],
    options: {},
    envKeys: [],
    inject: {
      '// @mount-routes': ["app.use('/api/v1/search', require('./routes/search.routes'));"],
      '// @client-imports': [],
      '{/* @nav-links */}': [],
      '{/* @routes */}': [],
      '// @seed-imports': [],
      '// @seed-run': [],
    },
  }
};

const ALL_MARKERS = [
  '// @global-middleware',
  '// @mount-routes',
  '// @client-imports',
  '{/* @nav-links */}',
  '{/* @routes */}',
  '// @seed-imports',
  '// @seed-run'
];

module.exports = { catalogue, ALL_MARKERS };
