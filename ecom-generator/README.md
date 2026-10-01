# E-commerce Generator (starter engine)

    npm install
    npm test        # resolves deps, generates, checks determinism, streams a zip
    npm start       # API on :4000

Endpoints (base /api/v1): GET /modules, POST /resolve, POST /generate, GET /download/:token

Add a module: 1) add an entry in src/catalogue.js (dependsOn, options, envKeys, inject)
2) add templates under templates/modules/<key>/ mirroring the output tree (server/..., client/...).
Cart, orders, payments, admin, reviews are declared but have no templates yet.
