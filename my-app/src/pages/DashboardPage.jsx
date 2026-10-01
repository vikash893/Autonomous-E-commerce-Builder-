import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteBuild,
  generateAndDownloadZip,
  getMyBuilds,
  saveBuild,
} from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  // Load Saved Builds
  useEffect(() => {
    loadBuilds();
  }, []);

  async function loadBuilds() {
    setLoading(true);
    try {
      const res = await getMyBuilds();
      if (res.data?.items) {
        setBuilds(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load builds:', err);
      setErrorNotice('Failed to load saved builds.');
    } finally {
      setLoading(false);
    }
  }

  // Duplicate build
  async function handleDuplicate(build) {
    try {
      const duplicatePayload = {
        name: `${build.name} (Copy)`,
        store: build.store,
        modules: build.modules,
        options: build.options,
      };
      const res = await saveBuild(duplicatePayload);
      if (res.data) {
        setNotice(`Duplicated build "${build.name}".`);
        loadBuilds();
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to duplicate build.');
    }
  }

  // Regenerate and download directly from dashboard
  async function handleRegenerate(build) {
    setDownloadingId(build._id);
    setNotice('');
    setErrorNotice('');
    try {
      const blueprint = {
        buildId: build._id,
        storeName: build.name,
        currency: build.store?.currency || '₹',
        theme: build.store?.theme || { primary: '#6366F1' },
        logoUrl: build.store?.logoUrl || '',
        modules: build.modules || ['products'],
        options: build.options || {},
      };
      await generateAndDownloadZip(blueprint);
      setNotice(`Downloaded zip for "${build.name}"!`);
      loadBuilds();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to generate zip.');
    } finally {
      setDownloadingId(null);
    }
  }

  // Delete build
  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete build "${name}"?`)) return;
    try {
      await deleteBuild(id);
      setBuilds((prev) => prev.filter((b) => b._id !== id));
      setNotice(`Deleted build "${name}".`);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to delete build.');
    }
  }

  return (
    <div className="dashboard-workspace">
      <aside className="dashboard-sidebar">
        <div className="sidebar-heading">
          <span className="sidebar-kicker">WORKSPACE</span>
          <strong>{user?.name || 'Builder'}</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          <Link to="/dashboard" className="sidebar-link sidebar-link-active">
            <span aria-hidden="true">▦</span> Overview
          </Link>
          <Link to="/build" className="sidebar-link">
            <span aria-hidden="true">＋</span> New build
          </Link>
          <Link to="/about" className="sidebar-link">
            <span aria-hidden="true">◌</span> How it works
          </Link>
          <Link to="/contact" className="sidebar-link">
            <span aria-hidden="true">↗</span> Contact team
          </Link>
          {isAdmin && (
            <Link to="/admin" className="sidebar-link sidebar-link-admin">
              <span aria-hidden="true">◆</span> Admin centre
            </Link>
          )}
        </nav>
        <div className="sidebar-tip">
          <span className="sidebar-tip-mark">✦</span>
          <strong>Build with intent.</strong>
          <p>Start from a clear store idea, then let the architecture follow.</p>
          <Link to="/build">Open builder <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <main className="dashboard-container dashboard-main">
      {/* Dashboard Top Header */}
      <div className="dashboard-header-row">
        <div>
          <span className="eyebrow eyebrow-teal">BUILDER WORKSPACE</span>
          <h1 className="dashboard-title">Welcome back, {user?.name || 'Developer'}.</h1>
          <p className="dashboard-subtitle">
            Manage your saved e-commerce codebases, duplicate architectures, or configure a new store.
          </p>
        </div>

        <div className="dashboard-top-actions">
          {isAdmin && (
            <Link to="/admin" className="button button-quiet">
              🛡️ Admin Centre
            </Link>
          )}
          <Link to="/build" className="button button-teal">
            <span aria-hidden="true">+</span> New Store Build
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="builder-alert alert-success">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice('')}>✕</button>
        </div>
      )}

      {errorNotice && (
        <div className="builder-alert alert-error">
          <span>⚠ {errorNotice}</span>
          <button type="button" onClick={() => setErrorNotice('')}>✕</button>
        </div>
      )}

      {/* Builds Section */}
      <div className="dashboard-builds-section">
        <div className="section-title-bar">
          <h2>
            Saved Store Configurations <span>({builds.length})</span>
          </h2>
          <span className="dev-caption">MERN CODE GENERATOR (PS-06)</span>
        </div>

        {loading ? (
          <p className="loading-text">Loading your builds...</p>
        ) : builds.length === 0 ? (
          <div className="empty-builds-card">
            <div className="empty-builds-icon">📦</div>
            <h3>No store builds saved yet</h3>
            <p>Select your modules and configure your first full-stack MERN e-commerce application.</p>
            <Link to="/build" className="button button-primary">
              ⚡ Open Builder Wizard
            </Link>
          </div>
        ) : (
          <div className="builds-grid">
            {builds.map((b) => (
              <div key={b._id} className="build-card">
                <div className="build-card-top">
                  <div className="build-header-info">
                    <span className="build-icon">🛍️</span>
                    <div>
                      <h3 className="build-name">{b.name}</h3>
                      <span className="build-meta">
                        Currency: {b.store?.currency || '₹'} &bull; Created{' '}
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className="build-theme-dot"
                    style={{ backgroundColor: b.store?.theme?.primary || '#6366F1' }}
                    title={`Theme: ${b.store?.theme?.primary || '#6366F1'}`}
                  />
                </div>

                <div className="build-modules-list">
                  <span className="modules-label">Modules ({b.modules?.length || 0}):</span>
                  <div className="module-pill-wrap">
                    {(b.modules || []).map((m) => (
                      <span key={m} className="badge badge-indigo">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="build-card-actions">
                  <button
                    type="button"
                    className="button button-small button-quiet"
                    onClick={() => navigate(`/build/${b._id}`)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    className="button button-small button-quiet"
                    onClick={() => handleDuplicate(b)}
                  >
                    📋 Duplicate
                  </button>

                  <button
                    type="button"
                    className="button button-small button-teal"
                    disabled={downloadingId === b._id}
                    onClick={() => handleRegenerate(b)}
                  >
                    {downloadingId === b._id ? 'Generating...' : '⚡ Download ZIP'}
                  </button>

                  <button
                    type="button"
                    className="button button-small button-danger"
                    onClick={() => handleDelete(b._id, b.name)}
                    title="Delete build"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}