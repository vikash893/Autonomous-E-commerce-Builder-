import { useState } from 'react'

function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setNotice('Project form is ready for your API.')
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR WORKSPACE</span>
          <h1>Good to see you.</h1>
          <p>Your ideas start here. Make a project and give your next store a home.</p>
        </div>
        <button className="button button-dark" type="button" onClick={() => { setIsCreating((open) => !open); setNotice('') }}>
          <span aria-hidden="true">+</span> Create new project
        </button>
      </div>

      {isCreating && (
        <form className="project-create" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="project-name">Project name</label>
            <input id="project-name" name="projectName" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" autoFocus required />
          </div>
          <div className="project-create-actions">
            <button className="button button-quiet" type="button" onClick={() => { setIsCreating(false); setProjectName(''); setNotice('') }}>Cancel</button>
            <button className="button button-dark" type="submit">Create project <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      )}

      <div className="dashboard-section-heading"><h2>Your projects</h2></div>
      <div className="project-empty">
        <div className="empty-mark" aria-hidden="true"><span /><span /><span /></div>
        <h2>No projects to show yet.</h2>
        <p>Your projects will appear here.</p>
        <button className="button button-dark" type="button" onClick={() => { setIsCreating(true); setNotice('') }}><span aria-hidden="true">+</span> Create new project</button>
      </div>
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}
    </section>
  )
}

export default DashboardPage