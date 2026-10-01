import { useEffect, useState } from 'react';
import { getAdminBuilds, getAdminStats, getAdminUsers, getModuleCatalogue } from '../api';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [users, setUsers] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [statsRes, catRes, usersRes, buildsRes] = await Promise.all([
          getAdminStats().catch(() => ({ data: {} })),
          getModuleCatalogue().catch(() => ({ data: {} })),
          getAdminUsers({ limit: 50 }).catch(() => ({ data: {} })),
          getAdminBuilds({ limit: 50 }).catch(() => ({ data: {} })),
        ]);

        if (statsRes.data?.stats) setStats(statsRes.data.stats);
        if (catRes.data?.catalogue) setCatalogue(catRes.data.catalogue);
        if (usersRes.data?.items) setUsers(usersRes.data.items);
        if (buildsRes.data?.items) setBuilds(buildsRes.data.items);
      } catch (err) {
        console.error('Failed to load admin panel data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <span className="eyebrow eyebrow-teal">SYSTEM ADMINISTRATION</span>
          <h1 className="admin-title">🛡️ Admin & Module Management</h1>
          <p className="admin-subtitle">
            Inspect platform generation metrics, manage module catalogue schemas, and review registered developer builds.
          </p>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="admin-tabs-bar">
        <button
          type="button"
          className={`tab-button ${activeTab === 'stats' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 System Analytics
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'catalogue' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('catalogue')}
        >
          🧩 Module Catalogue ({catalogue.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'builds' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('builds')}
        >
          📦 All Store Builds ({builds.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'users' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Registered Users ({users.length})
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading admin data...</p>
      ) : (
        <div className="admin-tab-content">
          {/* TAB 1: STATS */}
          {activeTab === 'stats' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">TOTAL DEVELOPER BUILDS</span>
                  <h3 className="stat-number">{stats?.totalBuilds || builds.length}</h3>
                  <span className="stat-sub">MERN configurations saved</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">SUCCESSFUL GENERATIONS</span>
                  <h3 className="stat-number stat-teal">{stats?.totalGenerations || 0}</h3>
                  <span className="stat-sub">Codebases streamed as ZIP</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">REGISTERED USERS</span>
                  <h3 className="stat-number">{stats?.totalUsers || users.length}</h3>
                  <span className="stat-sub">{stats?.totalAdmins || 1} admin accounts</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">CATALOGUE MODULES</span>
                  <h3 className="stat-number stat-indigo">{catalogue.length || 10}</h3>
                  <span className="stat-sub">Graph-resolved capabilities</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATALOGUE */}
          {activeTab === 'catalogue' && (
            <div className="catalogue-table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Category</th>
                    <th>Dependencies</th>
                    <th>Options Schema</th>
                    <th>Required .env Keys</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogue.map((m) => (
                    <tr key={m.key}>
                      <td>
                        <div className="table-module-cell">
                          <span>{m.icon}</span>
                          <div>
                            <strong>{m.name}</strong>
                            <span className="table-sub">{m.key}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-indigo">{m.category || 'Core'}</span>
                      </td>
                      <td>
                        {m.dependsOn && m.dependsOn.length > 0 ? (
                          <div className="table-chip-list">
                            {m.dependsOn.map((d) => (
                              <span key={d} className="dep-chip">
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="table-sub">None</span>
                        )}
                      </td>
                      <td>
                        <code className="code-snippet">
                          {Object.keys(m.options || {}).join(', ') || 'None'}
                        </code>
                      </td>
                      <td>
                        {m.envKeys && m.envKeys.length > 0 ? (
                          m.envKeys.map((e) => (
                            <code key={e.key} className="env-chip">
                              {e.key}
                            </code>
                          ))
                        ) : (
                          <span className="table-sub">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: BUILDS */}
          {activeTab === 'builds' && (
            <div className="catalogue-table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>Owner</th>
                    <th>Currency</th>
                    <th>Modules</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {builds.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>{b.ownerId?.name || b.ownerId?.email || 'User'}</td>
                      <td>{b.store?.currency || '₹'}</td>
                      <td>
                        <div className="table-chip-list">
                          {(b.modules || []).map((m) => (
                            <span key={m} className="badge badge-indigo">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: USERS */}
          {activeTab === 'users' && (
            <div className="catalogue-table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Developer Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'ADMIN' ? 'badge-teal' : 'badge-indigo'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}