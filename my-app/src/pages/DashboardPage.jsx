import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject, deleteProject, deleteUser, getAdminStats, getAdminUsers, getProjects } from '../api'
import { useAuth } from '../context/AuthContext'

function DashboardPage() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')

  // Admin stats state
  const [adminStats, setAdminStats] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  // Fetch projects on mount
  useEffect(() => {
    async function loadData() {
      setLoadingProjects(true)
      try {
        const res = await getProjects()
        if (res.success && Array.isArray(res.projects)) {
          setProjects(res.projects)
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
        setErrorNotice('Could not load projects. Please try refreshing.')
      } finally {
        setLoadingProjects(false)
      }

      // If admin, load system stats
      if (isAdmin) {
        try {
          const statsRes = await getAdminStats()
          if (statsRes.success) {
            setAdminStats(statsRes.stats)
          }
          const usersRes = await getAdminUsers({ limit: 50 })
          if (usersRes.success) {
            setAllUsers(usersRes.users)
          }
        } catch (err) {
          console.error('Failed to load admin stats:', err)
        }
      }
    }

    loadData()
  }, [isAdmin])

  // Handle Project Creation
  async function handleCreateProject(event) {
    event.preventDefault()
    if (!projectName.trim()) {
      setErrorNotice('Project name is required.')
      return
    }

    setSubmitting(true)
    setNotice('')
    setErrorNotice('')

    try {
      const generatedId = projectId.trim() || projectName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000)

      const res = await createProject({
        projectName: projectName.trim(),
        projectId: generatedId,
        description: description.trim(),
      })

      if (res.success && res.project) {
        setProjects((prev) => [res.project, ...prev])
        setNotice(`Project "${res.project.projectName}" created successfully!`)
        setProjectName('')
        setProjectId('')
        setDescription('')
        setIsCreating(false)
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to create project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Project Deletion
  async function handleDeleteProject(id, name) {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      return
    }

    try {
      const res = await deleteProject(id)
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p._id !== id && p.projectId !== id))
        setNotice(`Project "${name}" deleted successfully.`)
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to delete project.')
    }
  }

  // Handle User Account Deletion
  async function handleDeleteAccount() {
    if (!window.confirm('WARNING: Are you sure you want to delete your account? This action cannot be undone and will delete all your projects.')) {
      return
    }

    try {
      if (user?.id) {
        await deleteUser(user.id)
        logout()
        navigate('/register')
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to delete account.')
    }
  }

  return (
    <section className="dashboard-page">
      {/* Header Profile Section */}
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> YOUR WORKSPACE
          </span>
          <h1>Good to see you, {user?.name || 'User'}.</h1>
          <p>
            Logged in as <strong>{user?.email}</strong> &bull; Role:{' '}
            <span style={{ 
              fontWeight: '700', 
              color: isAdmin ? '#0284c7' : '#4b5563',
              background: isAdmin ? '#e0f2fe' : '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              {user?.role || 'USER'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              className="button button-lime"
              type="button"
              onClick={() => setShowAdminPanel((prev) => !prev)}
            >
              {showAdminPanel ? 'Hide Admin Panel' : '🛡️ Admin Controls'}
            </button>
          )}

          <button
            className="button button-dark"
            type="button"
            onClick={() => {
              setIsCreating((open) => !open)
              setNotice('')
              setErrorNotice('')
            }}
          >
            <span aria-hidden="true">+</span> {isCreating ? 'Close Form' : 'Create new project'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '6px',
          fontSize: '13px',
          border: '1px solid #c8e6c9'
        }}>
          ✓ {notice}
        </div>
      )}

      {errorNotice && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '6px',
          fontSize: '13px',
          border: '1px solid #ffcdd2'
        }}>
          ⚠ {errorNotice}
        </div>
      )}

      {/* ADMIN CONTROL PANEL */}
      {isAdmin && showAdminPanel && (
        <div style={{
          marginTop: '30px',
          padding: '24px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px'
        }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 16px', color: '#0f172a' }}>
            🛡️ Admin Control Panel
          </h2>

          {adminStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL USERS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0', color: '#0f172a' }}>{adminStats.totalUsers}</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ADMINS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0', color: '#0284c7' }}>{adminStats.totalAdmins}</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>STANDARD USERS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0', color: '#334155' }}>{adminStats.totalStandardUsers}</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOTAL PROJECTS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0', color: '#16a34a' }}>{adminStats.totalProjects}</p>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '15px', color: '#334155', marginBottom: '12px' }}>Registered Platform Users</h3>
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px' }}>Name</th>
                  <th style={{ padding: '10px 14px' }}>Email</th>
                  <th style={{ padding: '10px 14px' }}>Role</th>
                  <th style={{ padding: '10px 14px' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: u.role === 'ADMIN' ? '#e0f2fe' : '#f1f5f9',
                        color: u.role === 'ADMIN' ? '#0369a1' : '#475569'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PROJECT FORM */}
      {isCreating && (
        <form className="project-create" onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%' }}>
            <label className="field-label" htmlFor="project-name">
              Project name *
              <input
                id="project-name"
                name="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Modern Fashion Store"
                autoFocus
                required
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%' }}>
            <div>
              <label className="field-label" htmlFor="project-id">
                Project ID (slug / identifier)
                <input
                  id="project-id"
                  name="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="e.g. fashion-store-01 (auto-generated if empty)"
                />
              </label>
            </div>

            <div>
              <label className="field-label" htmlFor="project-desc">
                Description (optional)
                <input
                  id="project-desc"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this store project"
                />
              </label>
            </div>
          </div>

          <div className="project-create-actions" style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                setIsCreating(false)
                setProjectName('')
                setProjectId('')
                setDescription('')
                setErrorNotice('')
              }}
            >
              Cancel
            </button>
            <button className="button button-dark" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create project'}{' '}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      )}

      {/* PROJECTS SECTION */}
      <div className="dashboard-section-heading">
        <h2>
          Your projects <span>({projects.length})</span>
        </h2>
        <span className="dashboard-sort">UPDATED LIVE</span>
      </div>

      {loadingProjects ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="project-empty">
          <div className="empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>No projects to show yet.</h2>
          <p>Your e-commerce stores and projects will appear here.</p>
          <button
            className="button button-dark"
            type="button"
            onClick={() => {
              setIsCreating(true)
              setNotice('')
              setErrorNotice('')
            }}
          >
            <span aria-hidden="true">+</span> Create new project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((proj) => (
            <div className="project-row" key={proj._id || proj.projectId}>
              <div className="project-icon" aria-hidden="true">
                {proj.projectName ? proj.projectName.charAt(0).toUpperCase() : 'P'}
              </div>

              <div className="project-row-name">
                <h3>{proj.projectName}</h3>
                <p>
                  ID: <code>{proj.projectId}</code>
                  {proj.description && ` — ${proj.description}`}
                  {proj.createdAt && ` • Created: ${new Date(proj.createdAt).toLocaleDateString()}`}
                </p>
              </div>

              <div className="project-status">
                <i /> Active
              </div>

              <button
                className="button button-small button-quiet"
                style={{ color: '#c62828', border: '1px solid #ffcdd2', padding: '0 10px' }}
                type="button"
                onClick={() => handleDeleteProject(proj._id || proj.projectId, proj.projectName)}
                title="Delete Project"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone / Account Actions */}
      <div style={{
        marginTop: '60px',
        paddingTop: '24px',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#b91c1c' }}>Account Settings</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
            User ID: <code>{user?.id}</code> &bull; Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recent'}
          </p>
        </div>

        <button
          className="button button-small"
          style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
          type="button"
          onClick={handleDeleteAccount}
        >
          Delete My Account
        </button>
      </div>
    </section>
  )
}

export default DashboardPage