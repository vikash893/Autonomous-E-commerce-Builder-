# AGENTS.md — Instructions for AI Agents Working on This Repository

> Read **SPEC.md** first. This file contains behavioral rules and workflow instructions.

---

## Session Rules

1. **Work in small phases.** After each phase: run it, show the command and result, and stop for a go-ahead. Never build "the whole app" in one go.
2. **Before writing code**, give a short plan (files you'll create/change and why).
3. The generator is **template-based (EJS + marker injection)**. Do NOT call any LLM at runtime. Output must be deterministic.
4. The generated project must really **install and run**. After any change to templates, run `npm test` in `ecom-generator/`, generate a store into a temp folder, run `node --check` on its server files, and report if anything fails. Be honest about anything you could not verify. Do not claim something works unless you ran it.
5. Keep code **simple, commented where non-obvious, and consistent**. The team must be able to explain every file in a viva.
6. **Never hard-code secrets.** Never commit `.env`. Keep `.env.example` complete with one comment per key.
7. Follow the **API response/error shapes** and **design system** in SPEC.md exactly.
8. After each phase, suggest a **commit message**, and write a one-line entry for `PROMPTS.md`.

---

## How the Generator Works (Quick Reference)

### Pipeline
```
catalogue.js → resolve.js → generate.js → zip.js
```

1. **Catalogue** (`src/catalogue.js`): Each module declares `dependsOn`, `options`, `envKeys`, and `inject` (marker → lines).
2. **Resolve** (`src/resolve.js`): Transitive topological sort. `assertNoCycles()` at startup. `normalizeOptions()` validates option values. `collectEnvKeys()` unions base + module env keys.
3. **Generate** (`src/generate.js`): Creates temp dir → copies and renders `templates/base/` → renders each `templates/modules/<key>/` → runs `mergeMarkers` (replaces marker comments with injected lines) → writes `.env.example` → formats with Prettier → returns file list.
4. **Zip** (`src/zip.js`): Streams directory via `archiver`, cleans temp dir on close.

### Markers (in base templates)
| Marker | File | Purpose |
|---|---|---|
| `// @mount-routes` | `server/index.js.ejs` | Mount Express routers |
| `// @client-imports` | `client/src/App.jsx.ejs` | Import page components |
| `{/* @nav-links */}` | `client/src/App.jsx.ejs` | Add `<Link>` to nav |
| `{/* @routes */}` | `client/src/App.jsx.ejs` | Add `<Route>` to router |
| `// @seed-imports` | `server/scripts/seed.js.ejs` | Import models for seeding |
| `// @seed-run` | `server/scripts/seed.js.ejs` | Seed data insertion |

### EJS Template Context
```js
{
  storeName,        // "Bloom Boutique"
  slug,             // "bloom-boutique"
  currency,         // "₹" (default)
  theme: { primary },  // "#6366F1" (default)
  modules,          // ["auth", "products", ...] (resolved list)
  opts,             // { products: { variants: true, categories: true }, auth: { strategy: "jwt" }, ... }
  envKeys,          // [{ key, comment, required }, ...]
  has(key),         // helper: (key) => modules.includes(key)
}
```

### Adding a New Module (Checklist)
1. Add entry in `src/catalogue.js`:
   - `key`, `name`, `description`
   - `dependsOn: [...]`
   - `options: { optName: { type: 'boolean'|'enum', default: ..., values?: [...] } }`
   - `envKeys: [{ key, comment, required }]`
   - `inject: { '// @mount-routes': [...], '// @client-imports': [...], '{/* @nav-links */}': [...], '{/* @routes */}': [...], '// @seed-imports': [...], '// @seed-run': [...] }`
2. Create `templates/modules/<key>/` mirroring output tree:
   - `server/models/`, `server/routes/`, `server/middlewares/`
   - `client/src/pages/`, `client/src/components/`
3. Use `.ejs` extension for files needing template rendering.
4. Use `has('auth')`, `has('cart')` etc. for cross-module conditionals.
5. Use `opts.<module>.<option>` so options change generated output.
6. Run `npm test` in `ecom-generator/` to verify.

---

## Current State of the Repository

### Folder Structure
```
PS06/
├── SPEC.md                 # Project specification (READ THIS FIRST)
├── AGENTS.md               # This file
├── README.md               # Repo README
├── .gitignore
├── my-app/                 # Builder frontend (React + Vite, scaffolded, NOT built yet)
├── backend/                # Builder backend (Express, scaffolded, NOT built yet)
└── ecom-generator/         # ⭐ Starter engine (WORKING — this is the generator core)
    ├── src/catalogue.js    # Module definitions (auth ✅, products ✅, cart/orders/payments/admin/reviews ⬜ stubs)
    ├── src/resolve.js      # Dependency resolver (working)
    ├── src/generate.js     # Template renderer + marker merger (working)
    ├── src/zip.js          # Streaming zip (working)
    ├── src/server.js       # Express API: /modules, /resolve, /generate, /download (working)
    ├── test.js             # Test suite (resolve, determinism, options, API, zip)
    └── templates/
        ├── base/           # Base MERN boilerplate with markers
        └── modules/
            ├── auth/       # ✅ Complete templates
            └── products/   # ✅ Complete templates (with variants/categories conditionals)
```

### What Needs Building
| Priority | What | Where |
|---|---|---|
| **P0** | Cart, Orders, Payments, Admin, Reviews module templates | `ecom-generator/templates/modules/` |
| **P0** | Generator hardening (tests, cleanup, streaming) | `ecom-generator/` |
| **P0** | Builder backend API (auth, builds CRUD, resolve, generate) | `backend/` |
| **P0** | Builder frontend (wizard, module cards, file tree, generate) | `my-app/` |
| **P1** | Bonus modules (coupons, wishlist, search) | `ecom-generator/` |
| **P1** | Admin panel for module catalogue | `my-app/` + `backend/` |
| **P2** | Deployment, demo video, PROMPTS.md | Root |

---

## Debugging Protocol

When something breaks:
1. **Don't guess.** Reproduce the error.
2. Show the exact command and output.
3. Explain the root cause in two sentences.
4. Fix it in the **template/source** (not the generated output).
5. Re-run the same command to prove it's fixed.

## Before Committing

Review your own diff like a strict code reviewer:
- Dead code?
- Hard-coded values?
- Missing validation?
- Missing auth checks?
- Inconsistent naming?

Fix what you find and list what you changed.

---

## Test Commands

```bash
# Run the generator test suite
cd ecom-generator && npm test

# Start the generator API server
cd ecom-generator && npm start

# Generate a store via API
curl -X POST http://localhost:4000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"storeName":"Test Store","modules":["products","auth"]}'
```

---

## Commit Message Convention

```
feat(generator): add cart module templates
fix(templates): fix Product model variants conditional
feat(builder-api): add builds CRUD endpoints
feat(builder-ui): add module selection step
test(generator): add cart dependency resolution tests
docs: update SPEC.md with payments module
```
