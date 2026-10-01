# Prompt Log

- **Phase 1 (Codebase Audit & Wiring)**: Audit total codebase, fix backend models (`User.js`), validation schemas (`authValidation.js`), auth middleware (`authMiddleware.js`), rename `componenets` to `components`, wire `AuthForm.jsx` to backend auth API, and ensure generator test suite passes.
- **Phase 2 (Payment Security)**: Keep payment-enabled checkouts out of the orders collection until Razorpay verifies a captured payment; calculate amounts server-side and reject direct order creation.
- **Phase 3 (Deploy Frontend API)**: Point the builder frontend API clients to the deployed Render backend, preserving Vite environment-variable overrides.
- **Phase 5 (Builder Favicon)**: Add a compact SVG favicon inspired by the supplied e-commerce builder artwork and link it from the frontend document.