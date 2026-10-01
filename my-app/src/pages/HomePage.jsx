import { Link } from 'react-router-dom';

export default function HomePage() {
  const sampleModules = [
    { name: 'Products & Catalog', icon: '📦', desc: 'Models, APIs, product details, categories & variant logic.' },
    { name: 'Cart & Quantities', icon: '🛒', desc: 'Cart state, item quantities, guest checkout persistence.' },
    { name: 'Orders & Checkout', icon: '📋', desc: 'Order tracking, order history, and invoice generation.' },
    { name: 'Payment Gateway', icon: '💳', desc: 'Razorpay test-mode checkout with signature verification and payment tracking.' },
    { name: 'Auth & JWT Roles', icon: '🔐', desc: 'Bcrypt password hashing, token validation middleware & user roles.' },
    { name: 'Admin Dashboard', icon: '🛡️', desc: 'Resource management, KPI counters, and inventory administration.' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <span className="eyebrow eyebrow-teal">AUTONOMOUS E-COMMERCE BUILDER · CODE GENERATOR</span>
          <h1 className="hero-title">
            Cook a form, pick your modules, hit generate — get a runnable{' '}
            <span className="text-gradient">MERN E-commerce ZIP</span>.
          </h1>
          <p className="hero-description">
            Automate the entire plumbing of your online store. The generator resolves module dependencies, stitches
            models, APIs, and React UI with clean architecture, and packages a ready-to-run codebase with{' '}
            <code>.env.example</code> and <code>seed.js</code>.
          </p>

          <div className="hero-cta-group">
            <Link to="/build" className="button button-teal button-large">
              ⚡ Open Builder Wizard <span aria-hidden="true">→</span>
            </Link>
            <Link to="/register" className="button button-quiet button-large">
              Create Account
            </Link>
          </div>

          <div className="hero-badges">
            <span className="feature-pill">✓ Dependency Auto-Resolution</span>
            <span className="feature-pill">✓ Real Working Codebase</span>
            <span className="feature-pill">✓ Prettier Formatted Output</span>
          </div>
        </div>

        {/* Live Hero Mock Terminal / File Preview */}
        <div className="hero-terminal-card">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <span className="terminal-title">bloom-boutique.zip · Generated MERN App</span>
          </div>
          <pre className="terminal-code">
{`$ npx ecom-builder generate --name "Bloom Boutique"
✔ Resolving module graph (Payments → Orders → Cart → Products + Auth)
✔ Rendering EJS templates (22 files)
✔ Merging route injections & client navigation
✔ Prettier code formatting completed
✔ Generated bloom-boutique.zip (48.2 KB)

# Quick Start:
$ cd bloom-boutique
$ cp .env.example .env && npm run seed && npm run dev
🚀 Server running at http://localhost:5000
🛒 Client running at http://localhost:5173`}
          </pre>
        </div>
      </section>

      {/* Modules Showcase Section */}
      <section className="landing-modules-section">
        <div className="section-header-center">
          <span className="eyebrow eyebrow-indigo">INTELLIGENT COMPOSITION</span>
          <h2>A Modular Architecture That Truly Runs Together</h2>
          <p>
            No disconnected snippets. Selecting a payment gateway wires checkout to orders, which binds to cart items
            and verified customer accounts.
          </p>
        </div>

        <div className="landing-modules-grid">
          {sampleModules.map((m) => (
            <div key={m.name} className="landing-module-card">
              <span className="module-big-icon">{m.icon}</span>
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Generator Pipeline Walkthrough */}
      <section className="pipeline-section">
        <div className="pipeline-inner">
          <div className="pipeline-text">
            <span className="eyebrow eyebrow-teal">8-STEP PIPELINE</span>
            <h2>How the Code Generator Works</h2>
            <ol className="pipeline-steps">
              <li>
                <strong>1. Blueprint Validation:</strong> Zod validates store parameters and options.
              </li>
              <li>
                <strong>2. Topological Sort:</strong> Transitive dependency resolution auto-includes prerequisites.
              </li>
              <li>
                <strong>3. Base Template Copy:</strong> Scaffolds Vite React client, Express API, and configs.
              </li>
              <li>
                <strong>4. EJS Rendering:</strong> Parameterizes models, controllers, and JSX views.
              </li>
              <li>
                <strong>5. Marker Merge Pass:</strong> Replaces <code>// @mount-routes</code> and <code>{`{/* @nav-links */}`}</code>.
              </li>
              <li>
                <strong>6. Prettier Formatting:</strong> Produces clean, production-grade code.
              </li>
              <li>
                <strong>7. Archiver Stream:</strong> Compresses the folder and streams a downloadable ZIP.
              </li>
            </ol>
            <div style={{ marginTop: '24px' }}>
              <Link to="/build" className="button button-teal">
                Try it in the Builder <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}