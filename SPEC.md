# SPEC.md — Autonomous E-commerce Builder (Code Generator)
> **Problem Statement 06** | W3Grads Full Stack Vibe Coding Examination 2026
> **Repository**: [Autonomous-E-commerce-Builder-](https://github.com/vikash893/Autonomous-E-commerce-Builder-)

---

## What We Are Building

A web app called the **Builder** that generates other web apps. A logged-in user fills a wizard (store basics → pick modules → set options → review) and clicks **Generate**. The server produces a complete, runnable **custom-coded MERN e-commerce project** and streams it as a `.zip`. The user unzips it, copies `.env.example` to `.env`, fills in keys, then runs `npm run install:all`, `npm run seed`, `npm run dev` and gets a working store.

---

## The Two Applications (Never Mix Them Up)

| | **Builder App** (what we submit) | **Generated Store** (output of the generator) |
|---|---|---|
| **Purpose** | Login, dashboard of saved builds, wizard, module catalogue, generator API | Products, cart, orders, payments, admin — a full e-commerce store |
| **Database** | `users`, `modules`, `builds`, `generations` (Builder MongoDB) | Its own separate MongoDB when the user runs it |
| **Location** | This repository | Output `.zip` file downloaded by the user |
| **Stack** | React (Vite) + Tailwind + zustand; Node + Express; MongoDB Atlas | React (Vite) + Express + Mongoose (from templates) |

---

## Hard Rules (Exam Rules — Do Not Violate)

1. Generated output must be **deterministic** (same config → same files) and must **install and run** on a fresh machine.
2. **No AI/LLM calls in the generator.** It is template-based (EJS + marker injection). Do not generate code with a model at runtime.
3. Modules must be **genuinely wired together**: Order references Product and User; checkout calls Payments; Cart uses Product. No disconnected snippets.
4. Per-module **options must change the generated output** (e.g. `variants` on/off, payment `provider`, `guestCart`).
5. Never commit secrets. Only `.env.example` with placeholders and a one-line comment per key.
6. Stream the zip (`archiver`), never buffer it. Clean temp dirs. If generation fails midway, serve no partial zip.
7. Every API body validated server-side (Zod). Central error middleware, no stack traces in responses.
8. Code must be simple and readable. The team must be able to explain every file in a viva.
9. Commit small and often with meaningful messages (`feat(generator): add cart module`).

---

## Module Catalogue (Minimum 6: Products, Cart, Orders, Payments, Auth, Admin)

| Module | Depends On | Options | Generates |
|---|---|---|---|
| `auth` | *none* | `strategy` (jwt) | User model, auth routes, JWT middleware, Login/Signup UI, admin seed user |
| `products` | *none* | `categories` (bool), `variants` (bool) | Product model, product routes, listing/detail UI, admin CRUD |
| `cart` | `products` | `guestCart` (bool) | Cart model/routes, cart UI, add-to-cart buttons |
| `orders` | `cart`, `products`, `auth` | `statuses` (list) | Order model (items ref Product, user ref User), order routes, checkout + history UI |
| `payments` | `orders` | `provider` razorpay/stripe (test mode) | Payment routes, gateway integration, verify endpoint, checkout wiring |
| `admin` | `auth` | `resources` | Admin layout, protected routes, CRUD tables, KPIs |
| `reviews` | `products`, `auth` | `moderation` (bool) | Review model, routes, stars UI |
| `coupons` | `orders` | *(bonus)* | Coupon model, routes, coupon input UI |
| `wishlist` | `products`, `auth` | *(bonus)* | Wishlist model, routes, wishlist page |
| `search` | `products` | *(bonus)* | Search controller, filter sidebar, search bar |

### Dependency Resolution Rules
- **Transitive auto-inclusion**: Selecting `payments` → resolves `orders` → `cart` + `products` + `auth`.
- **Topologically sorted** (deps first), deterministic.
- **Cycle-safe**: `assertNoCycles()` runs at startup.
- **Audit trail**: `POST /resolve` returns `{ resolved, autoAdded:[{module, requiredBy[]}], envKeys, fileTree }`.

---

## Existing Starter Engine (`ecom-generator/`)

The starter code already provides a working generator core. This is what exists and how it works:

### Directory Structure
```
ecom-generator/
├── package.json              # archiver, cors, ejs, express, fs-extra, prettier, zod
├── test.js                   # Full test suite (resolve, generate, determinism, API, zip)
├── src/
│   ├── catalogue.js          # Module definitions: deps, options, envKeys, inject map
│   ├── resolve.js            # Transitive topological sort, cycle check, option validation
│   ├── generate.js           # Temp dir → copy base → render EJS → merge markers → .env → Prettier
│   ├── zip.js                # Streamed archiver (no buffering)
│   └── server.js             # Express API: /modules, /resolve, /generate, /download/:token
└── templates/
    ├── base/                 # Base MERN boilerplate with markers
    │   ├── package.json.ejs  # Root package with install:all, dev (concurrently), seed
    │   ├── README.md.ejs     # Generated README with setup steps
    │   ├── .gitignore
    │   ├── .prettierrc
    │   ├── server/
    │   │   ├── index.js.ejs         # Express app with // @mount-routes marker
    │   │   ├── package.json.ejs     # Conditionally includes bcryptjs/jwt if has('auth')
    │   │   └── scripts/seed.js.ejs  # // @seed-imports and // @seed-run markers
    │   └── client/
    │       ├── index.html.ejs
    │       ├── package.json.ejs
    │       ├── vite.config.js
    │       └── src/
    │           ├── App.jsx.ejs      # // @client-imports, {/* @nav-links */}, {/* @routes */}
    │           ├── api.js.ejs       # Fetch wrapper with Bearer token
    │           ├── index.css.ejs
    │           └── main.jsx
    └── modules/
        ├── auth/                    # User.js, auth.routes.js, auth middleware, Login.jsx
        └── products/                # Product.js.ejs (variants/categories conditional), routes.ejs, Products.jsx.ejs
```

### Generator Pipeline (How It Works)
```
catalogue.js (modules, deps, options, envKeys, inject map)
    → resolve.js (transitive topological sort, cycle check, option validation, requiredBy reasons)
    → generate.js:
        1. Create temp dir
        2. Copy & render templates/base/ (EJS with { storeName, slug, currency, theme, modules, opts, envKeys, has(key) })
        3. For each resolved module: render templates/modules/<key>/ (skip if dir missing)
        4. mergeMarkers pass: replace ALL_MARKERS with aggregated inject lines
        5. Build .env.example by unioning envKeys
        6. Format all output with Prettier
        7. Return { dir, outDir, name, files, resolved, autoAdded, envKeys, skipped }
    → zip.js (streamed via archiver, temp dir cleaned on close)
```

### Marker Injection System
Base template files contain comment markers. During the merge pass, each marker is replaced with the concatenated `inject` lines from all resolved modules:

| Marker | Location | Purpose |
|---|---|---|
| `// @mount-routes` | `server/index.js` | Mount Express routers |
| `// @client-imports` | `client/src/App.jsx` | Import page components |
| `{/* @nav-links */}` | `client/src/App.jsx` | Navigation `<Link>` elements |
| `{/* @routes */}` | `client/src/App.jsx` | React Router `<Route>` elements |
| `// @seed-imports` | `server/scripts/seed.js` | Import models for seeding |
| `// @seed-run` | `server/scripts/seed.js` | Seed data insertion code |

### How to Add a New Module
1. Add a catalogue entry in `catalogue.js` (key, name, description, `dependsOn`, `options`, `envKeys`, `inject`).
2. Create templates under `templates/modules/<key>/` mirroring the output tree (`server/...`, `client/src/...`).
3. Files ending `.ejs` are rendered with the full context: `{ storeName, slug, currency, theme, modules, opts, envKeys, has(key) }`.
4. Use `has('auth')` to conditionally include auth-dependent code. Use `opts.<module>.<option>` so options change output.

### Current Module Status
- **`auth`**: ✅ Fully templated (User model, routes, middleware, Login.jsx, seed admin user)
- **`products`**: ✅ Fully templated (Product model with variants/categories conditionals, routes with conditional auth, Products.jsx)
- **`cart`**: ⬜ Catalogue entry exists, NO templates yet
- **`orders`**: ⬜ Catalogue entry exists, NO templates yet
- **`payments`**: ⬜ Catalogue entry exists, NO templates yet
- **`admin`**: ⬜ Catalogue entry exists, NO templates yet
- **`reviews`**: ⬜ Catalogue entry exists, NO templates yet

---

## Builder API (Base `/api/v1`)

### Response Shapes
```jsonc
// Success
{ "success": true, "data": { ... }, "message": "Optional" }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Reason", "details": [] } }

// Paginated list
{ "success": true, "data": { "items": [], "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### Endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register builder user |
| `POST` | `/auth/login` | Public | Authenticate builder user (JWT) |
| `GET` | `/modules` | Public | Return full module catalogue |
| `POST` | `/builds` | User | Save a build configuration |
| `GET` | `/builds/mine` | User | List builds belonging to current user |
| `GET` | `/builds/:id` | User | Retrieve specific saved build |
| `PATCH` | `/builds/:id` | User | Update build configuration |
| `POST` | `/builds/:id/resolve` | User | Resolve: returns resolved, autoAdded, envKeys, fileTree (no generation) |
| `POST` | `/generate` | User | Generate project → returns download token |
| `GET` | `/download/:token` | User | Stream generated zip (one-time, expires 10 min) |
| `GET/POST/PATCH` | `/admin/modules` | Admin | Manage module catalogue (P1) |

---

## Builder Database (MongoDB)

- **`modules`**: `key` (unique), `name`, `description`, `icon`, `dependsOn[]`, `options`, `templates[]`, `envKeys[{key,comment,required}]`, `category`, `order`, `isActive`
- **`builds`**: `ownerId`, `name`, `store{currency,theme,logoUrl}`, `modules[]`, `options`, `lastGeneratedAt`, `createdAt`
- **`users`**: `name`, `email` (unique), `passwordHash`, `role` (USER|ADMIN), `isActive`
- **`generations`**: `buildId`, `ownerId`, `resolvedModules[]`, `fileCount`, `sizeBytes`, `status`, `createdAt`

---

## Builder Pages

| Route | Page | Key Features |
|---|---|---|
| `/` | Landing | Hero, feature highlights, CTA |
| `/login` | Login | Email + password form |
| `/signup` | Signup | Name + email + password form |
| `/dashboard` | Dashboard | List saved builds; open, duplicate, regenerate, delete |
| `/build` | Wizard | 4-step: Basics → Modules → Options → Review |
| `/build/review` | Review & Generate | File tree, module map, env keys, Generate button with progress |
| `/admin` | Admin Panel | Module catalogue management (P1) |

### Module Card UX
- Toggle switch, icon, dependency chips
- Turning a module ON → auto-enables dependencies, shown locked with a teal **"required by X"** badge
- Turning OFF → warns if others depend on it (cascade-with-warning or block — be consistent)
- Wizard cannot generate with an invalid config
- Generate button shows progress: resolving → rendering → zipping → ready

---

## Design System (Dark Dev-Tool Theme)

| Token | Value | Usage |
|---|---|---|
| Base | `#0B1020` | Page background |
| Surface | `#151B2E` | Cards, panels, wizard steps |
| Primary | `#6366F1` (Indigo) | Active buttons, user-selected cards |
| Accent | `#14B8A6` (Teal) | Auto-resolved modules, generate CTA, success |
| Warning | `#F59E0B` (Amber) | Dependency removal notices, conflict warnings |
| Line | `#27304A` | Borders, file-tree connecting lines |
| Text | `#E5E9F5` | Primary text |
| Muted | `#8A93AD` | Code comments, secondary subtitles |

- **UI Font**: Inter / Outfit
- **Code Font**: JetBrains Mono / Fira Code (file trees, env keys, code previews)
- **States**: Loading, empty, error, success on every data screen
- **Responsive**: From 360px up
- **Stack**: React (Vite) + Tailwind (+ shadcn/ui optional) + zustand; Node + Express; MongoDB Atlas; EJS, archiver, fs-extra, prettier, zod

---

## Scoring Priorities (100 Marks)

| Criterion | Focus | Marks |
|---|---|---|
| Module relations | Accurate DAG resolution, auto-selection, real wiring | **20** |
| Generated code runs | Zip installs, runs, core flow works (Browse → Cart → Checkout → Pay) | **20** |
| Output code quality | Clean code, .env.example, seed.js, README.md | **14** |
| Generator design | Robust templating, deterministic, marker merge, streaming zip, cleanup | **12** |
| Builder UX | Clean wizard, auto-deps, live file tree, responsive | **12** |
| Breadth & options | ≥6 modules with meaningful configurable options | **8** |
| Builder basics | Auth, saved builds, dashboard | **6** |
| Deploy & docs | Live links, documentation, demo video | **3** |
| Viva & PROMPTS.md | Explain every route, template, design decision | **5** |
| Bonus | Live preview, GitHub push, theme injection, plugin system | **+10** |

---

## Implementation Phases

| Phase | Scope |
|---|---|
| **1** | Verify starter engine, fix bugs so generated store installs + seeds + starts |
| **2** | Add `cart` module (catalogue + templates, guestCart option) |
| **3** | Add `orders` module (server-side price calc, cart clearing, stock decrement) |
| **4** | Add `payments` module (Razorpay/Stripe test mode, provider option) |
| **5** | Add `admin` + `reviews` modules |
| **6** | Generator hardening (transitive tests, cycle detection, determinism, streaming, cleanup) |
| **7** | Builder backend (users, builds, catalogue in MongoDB, Zod, JWT, rate-limit) |
| **8** | Builder frontend (Tailwind, wizard, module cards, file tree, zustand, responsive) |
| **9** | Ship (end-to-end test, README, PROMPTS.md, deploy checklist, demo video script) |

---

## Deliverables

- GitHub repo (every member commits)
- README (template from PDF)
- `.env.example` (no secrets)
- Live deployment or flawless local setup
- 3–5 min demo video
- Test credentials: `admin@demo.com` / `Admin@123`
- `PROMPTS.md` (10–20 key prompts with one-line notes)
- At least one generated zip that runs
- Modules/deps documentation
