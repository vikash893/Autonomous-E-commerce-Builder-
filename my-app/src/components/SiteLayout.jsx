import { Link, NavLink, Outlet } from 'react-router-dom'

function Brand({ light = false }) {
  return (
    <Link className={`brand${light ? ' brand-light' : ''}`} to="/" aria-label="Forma home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>forma<span className="brand-period">.</span></span>
    </Link>
  )
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <div className="header-actions">
          <Link className="login-link" to="/login">Log in</Link>
          <Link className="button button-small button-dark" to="/register">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Brand />
        <p>Make room for what’s next.</p>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Log in</Link>
        </div>
        <span className="copyright">© 2026 Forma</span>
      </div>
    </footer>
  )
}

export function AuthBrand() {
  return <Brand />
}

function SiteLayout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  )
}

export default SiteLayout