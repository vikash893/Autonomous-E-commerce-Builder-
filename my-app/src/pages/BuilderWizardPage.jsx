import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  generateAndDownloadZip,
  getBuildById,
  getModuleCatalogue,
  resolveBlueprint,
  saveBuild,
  updateBuild,
} from '../api';
import { useAuth } from '../context/AuthContext';
import FileTreePreview from '../components/FileTreePreview';
import ModuleCard from '../components/ModuleCard';

const STEPS = [
  { id: 1, label: 'Store Basics', icon: '🏪' },
  { id: 2, label: 'Select Modules', icon: '🧩' },
  { id: 3, label: 'Module Options', icon: '⚙️' },
  { id: 4, label: 'Review & Generate', icon: '🚀' },
];

const PRESET_COLORS = ['#6366F1', '#14B8A6', '#EC4899', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

export default function BuilderWizardPage() {
  const { id: buildId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [catalogue, setCatalogue] = useState([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);

  // Form State
  const [storeName, setStoreName] = useState('Bloom Boutique');
  const [currency, setCurrency] = useState('₹');
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [logoUrl, setLogoUrl] = useState('');

  // Selected module keys (user's explicit selection)
  const [selectedModules, setSelectedModules] = useState(['products', 'cart', 'auth', 'orders', 'payments', 'admin']);
  const [resolvedModules, setResolvedModules] = useState([]);
  const [autoAdded, setAutoAdded] = useState([]);
  const [envKeys, setEnvKeys] = useState([]);
  const [fileTree, setFileTree] = useState([]);

  // Options State
  const [moduleOptions, setModuleOptions] = useState({
    products: { categories: true, variants: false },
    cart: { guestCart: true },
    auth: { strategy: 'jwt' },
    orders: { invoices: true },
    payments: { provider: 'razorpay' },
    reviews: { moderation: false },
    coupons: { discountType: 'percentage' },
  });

  // UI state
  const [resolving, setResolving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStepText, setGenStepText] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Module Catalogue on Mount
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const res = await getModuleCatalogue();
        if (res.data?.catalogue) {
          setCatalogue(res.data.catalogue);
        }
      } catch (err) {
        console.error('Failed to load catalogue from API, using defaults:', err);
      } finally {
        setLoadingCatalogue(false);
      }
    }

    loadCatalogue();
  }, []);

  // 2. Load Existing Build if Editing
  useEffect(() => {
    if (buildId && isAuthenticated) {
      getBuildById(buildId)
        .then((res) => {
          const b = res.data;
          if (b) {
            setStoreName(b.name || '');
            setCurrency(b.store?.currency || '₹');
            setPrimaryColor(b.store?.theme?.primary || '#6366F1');
            setLogoUrl(b.store?.logoUrl || '');
            if (Array.isArray(b.modules)) setSelectedModules(b.modules);
            if (b.options) setModuleOptions(b.options);
          }
        })
        .catch((err) => console.error('Failed to load build config:', err));
    }
  }, [buildId, isAuthenticated]);

  // 3. Resolve Dependencies Whenever Selected Modules Change
  useEffect(() => {
    async function doResolve() {
      setResolving(true);
      try {
        const res = await resolveBlueprint(selectedModules, moduleOptions);
        if (res.data) {
          setResolvedModules(res.data.resolved || []);
          setAutoAdded(res.data.autoAdded || []);
          setEnvKeys(res.data.envKeys || []);
          setFileTree(res.data.fileTree || []);
          setErrorMessage('');
        }
      } catch (err) {
        setErrorMessage(err.message || 'Error resolving module dependencies.');
      } finally {
        setResolving(false);
      }
    }

    doResolve();
  }, [selectedModules, moduleOptions]);

  // Module toggle handler with dependency warnings & cascading
  function handleModuleToggle(key) {
    if (selectedModules.includes(key)) {
      // Trying to unselect
      if (key === 'products') {
        alert('Products & Catalog is the foundational module required by all e-commerce stores.');
        return;
      }
      setSelectedModules((prev) => prev.filter((k) => k !== key));
    } else {
      setSelectedModules((prev) => [...prev, key]);
    }
  }

  function handleOptionChange(modKey, optName, val) {
    setModuleOptions((prev) => ({
      ...prev,
      [modKey]: {
        ...(prev[modKey] || {}),
        [optName]: val,
      },
    }));
  }

  // Save Build Config to Backend
  async function handleSaveBuild() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSaveNotice('');
      const payload = {
        name: storeName,
        store: {
          currency,
          theme: { primary: primaryColor },
          logoUrl,
        },
        modules: selectedModules,
        options: moduleOptions,
      };

      if (buildId) {
        await updateBuild(buildId, payload);
        setSaveNotice('Build configuration updated successfully!');
      } else {
        const res = await saveBuild(payload);
        setSaveNotice('Build configuration saved to your dashboard!');
        if (res.data?._id) {
          navigate(`/build/${res.data._id}`, { replace: true });
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save build configuration.');
    }
  }

  // Generate & Download ZIP
  async function handleGenerate() {
    setGenerating(true);
    setErrorMessage('');
    setSaveNotice('');

    try {
      setGenStepText('1/4: Resolving module dependency graph...');
      await new Promise((r) => setTimeout(r, 400));

      setGenStepText('2/4: Rendering MERN source templates...');
      await new Promise((r) => setTimeout(r, 400));

      setGenStepText('3/4: Stitching routes, nav links & formatting code...');
      await new Promise((r) => setTimeout(r, 400));

      setGenStepText('4/4: Assembling and streaming ZIP package...');

      const blueprint = {
        buildId,
        storeName,
        currency,
        theme: { primary: primaryColor },
        logoUrl,
        modules: selectedModules,
        options: moduleOptions,
      };

      await generateAndDownloadZip(blueprint);

      setGenStepText('✅ Download complete! Open your downloaded ZIP to run your store.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate project.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="builder-layout">
      {/* Wizard Top Step Indicator */}
      <div className="wizard-stepper-wrap">
        <div className="wizard-stepper">
          {STEPS.map((s) => {
            const isDone = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                className={`wizard-step-item ${isCurrent ? 'step-active' : ''} ${
                  isDone ? 'step-done' : ''
                }`}
                onClick={() => setCurrentStep(s.id)}
              >
                <div className="step-circle">
                  {isDone ? '✓' : <span>{s.icon}</span>}
                </div>
                <div className="step-info">
                  <span className="step-number">STEP 0{s.id}</span>
                  <span className="step-label">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="builder-alert alert-error">
          <span>⚠ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')}>✕</button>
        </div>
      )}

      {saveNotice && (
        <div className="builder-alert alert-success">
          <span>✓ {saveNotice}</span>
          <button type="button" onClick={() => setSaveNotice('')}>✕</button>
        </div>
      )}

      {/* STEP CONTENT & SPLIT LAYOUT */}
      <div className="builder-main-grid">
        <div className="builder-form-pane">
          {/* STEP 1: STORE BASICS */}
          {currentStep === 1 && (
            <div className="wizard-panel">
              <div className="panel-title-wrap">
                <span className="eyebrow eyebrow-teal">STEP 1 OF 4</span>
                <h2>Configure Store Basics</h2>
                <p>Set up the identity, currency, and styling of your generated MERN store.</p>
              </div>

              <div className="form-group-grid">
                <label className="dev-label" htmlFor="store-name">
                  Store Name *
                  <input
                    id="store-name"
                    type="text"
                    className="dev-input"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Bloom Boutique, Urban Threads"
                    required
                  />
                </label>

                <label className="dev-label" htmlFor="store-currency">
                  Currency Symbol
                  <select
                    id="store-currency"
                    className="dev-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="₹">₹ INR (Indian Rupee)</option>
                    <option value="$">$ USD (US Dollar)</option>
                    <option value="€">€ EUR (Euro)</option>
                    <option value="£">£ GBP (British Pound)</option>
                    <option value="¥">¥ JPY (Japanese Yen)</option>
                  </select>
                </label>

                <div className="dev-label">
                  Primary Theme Color
                  <div className="color-picker-row">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${primaryColor === color ? 'swatch-active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setPrimaryColor(color)}
                      />
                    ))}
                    <input
                      type="color"
                      className="color-custom-input"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      title="Custom color"
                    />
                    <code className="color-code">{primaryColor}</code>
                  </div>
                </div>

                <label className="dev-label" htmlFor="store-logo">
                  Store Logo URL (Optional)
                  <input
                    id="store-logo"
                    type="url"
                    className="dev-input"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </label>
              </div>

              <div className="wizard-nav-actions">
                <div />
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                >
                  Next: Select Modules <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MODULE SELECTION */}
          {currentStep === 2 && (
            <div className="wizard-panel">
              <div className="panel-title-wrap">
                <span className="eyebrow eyebrow-teal">STEP 2 OF 4</span>
                <h2>Choose Store Capabilities</h2>
                <p>
                  Pick your desired features. Prerequisites are automatically resolved and highlighted with a
                  teal badge.
                </p>
              </div>

              {loadingCatalogue ? (
                <p className="loading-text">Loading module catalogue...</p>
              ) : (
                <div className="modules-grid">
                  {catalogue.map((mod) => {
                    const isSelected = resolvedModules.includes(mod.key);
                    const autoInfo = autoAdded.find((a) => a.module === mod.key);
                    const isAuto = !!autoInfo;

                    return (
                      <ModuleCard
                        key={mod.key}
                        module={mod}
                        isSelected={isSelected}
                        isAutoAdded={isAuto}
                        requiredBy={autoInfo ? autoInfo.requiredBy : []}
                        onToggle={handleModuleToggle}
                        onConfigureOptions={() => setCurrentStep(3)}
                      />
                    );
                  })}
                </div>
              )}

              <div className="wizard-nav-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back to Basics
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => setCurrentStep(3)}
                >
                  Next: Configure Options <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONS CONFIGURATION */}
          {currentStep === 3 && (
            <div className="wizard-panel">
              <div className="panel-title-wrap">
                <span className="eyebrow eyebrow-teal">STEP 3 OF 4</span>
                <h2>Configure Module Options</h2>
                <p>Customize granular options for each selected feature.</p>
              </div>

              <div className="options-container">
                {resolvedModules.includes('products') && (
                  <div className="option-card">
                    <h3>📦 Products & Catalog Options</h3>
                    <div className="option-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={moduleOptions.products?.categories ?? true}
                          onChange={(e) => handleOptionChange('products', 'categories', e.target.checked)}
                        />
                        <span>Enable product categories hierarchy</span>
                      </label>
                    </div>
                    <div className="option-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={moduleOptions.products?.variants ?? false}
                          onChange={(e) => handleOptionChange('products', 'variants', e.target.checked)}
                        />
                        <span>Enable product variants (Sizes, Colors, SKUs)</span>
                      </label>
                    </div>
                  </div>
                )}

                {resolvedModules.includes('payments') && (
                  <div className="option-card">
                    <h3>💳 Payment Gateway Provider</h3>
                    <p className="option-desc">Select default gateway wiring in checkout.</p>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_provider"
                          value="razorpay"
                          checked={(moduleOptions.payments?.provider || 'razorpay') === 'razorpay'}
                          onChange={() => handleOptionChange('payments', 'provider', 'razorpay')}
                        />
                        <span>Razorpay (Test Mode & Webhooks)</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_provider"
                          value="stripe"
                          checked={moduleOptions.payments?.provider === 'stripe'}
                          onChange={() => handleOptionChange('payments', 'provider', 'stripe')}
                        />
                        <span>Stripe Elements (Test Mode)</span>
                      </label>
                    </div>
                  </div>
                )}

                {resolvedModules.includes('cart') && (
                  <div className="option-card">
                    <h3>🛒 Shopping Cart Settings</h3>
                    <div className="option-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={moduleOptions.cart?.guestCart ?? true}
                          onChange={(e) => handleOptionChange('cart', 'guestCart', e.target.checked)}
                        />
                        <span>Allow guest cart (persist unauthenticated customer cart in localStorage)</span>
                      </label>
                    </div>
                  </div>
                )}

                {resolvedModules.includes('orders') && (
                  <div className="option-card">
                    <h3>📋 Orders & Invoicing</h3>
                    <div className="option-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={moduleOptions.orders?.invoices ?? true}
                          onChange={(e) => handleOptionChange('orders', 'invoices', e.target.checked)}
                        />
                        <span>Generate customer order invoice receipts</span>
                      </label>
                    </div>
                  </div>
                )}

                {resolvedModules.includes('coupons') && (
                  <div className="option-card">
                    <h3>🏷️ Discount Coupons</h3>
                    <div className="option-row">
                      <label className="dev-label">
                        Default Discount Type
                        <select
                          className="dev-select"
                          value={moduleOptions.coupons?.discountType || 'percentage'}
                          onChange={(e) => handleOptionChange('coupons', 'discountType', e.target.value)}
                        >
                          <option value="percentage">Percentage Discount (%)</option>
                          <option value="flat">Flat Amount Discount</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="wizard-nav-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Back to Modules
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => setCurrentStep(4)}
                >
                  Next: Review & Generate <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & GENERATE */}
          {currentStep === 4 && (
            <div className="wizard-panel">
              <div className="panel-title-wrap">
                <span className="eyebrow eyebrow-teal">STEP 4 OF 4</span>
                <h2>Review Blueprint & Generate</h2>
                <p>Inspect the resolved modules, required environment variables, and download your zip.</p>
              </div>

              <div className="review-summary-box">
                <div className="summary-row">
                  <span className="summary-title">Store Name:</span>
                  <span className="summary-value"><strong>{storeName}</strong></span>
                </div>
                <div className="summary-row">
                  <span className="summary-title">Currency & Theme:</span>
                  <span className="summary-value">
                    {currency} &bull; <span style={{ color: primaryColor }}>■ {primaryColor}</span>
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-title">Resolved Modules ({resolvedModules.length}):</span>
                  <div className="summary-chips">
                    {resolvedModules.map((m) => (
                      <span key={m} className="badge badge-indigo">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="review-actions-bar">
                {isAuthenticated && (
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={handleSaveBuild}
                  >
                    💾 Save Config
                  </button>
                )}

                <button
                  type="button"
                  className="button button-teal button-large"
                  disabled={generating}
                  onClick={handleGenerate}
                >
                  {generating ? '⏳ Generating Project...' : '⚡ Generate & Download ZIP'}
                </button>
              </div>

              {genStepText && (
                <div className="generation-progress-box">
                  <div className="spinner" />
                  <p>{genStepText}</p>
                </div>
              )}

              <div className="wizard-nav-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setCurrentStep(3)}
                >
                  ← Back to Options
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: LIVE FILE TREE & ENV PREVIEW */}
        <div className="builder-sidebar-pane">
          <FileTreePreview fileList={fileTree} envKeys={envKeys} />
        </div>
      </div>
    </div>
  );
}
