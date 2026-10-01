import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Brand({ light = false }) {
  return (
    <Link
      className={`brand${light ? ' brand-light' : ''}`}
      to="/"
      aria-label="Forma home"
    >
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        forma<span className="brand-period">.</span>
      </span>
    </Link>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close menu when Escape is pressed
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  function toggleMenu() {
    setMenuOpen((previous) => !previous)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    closeMenu()
    logout()
    navigate('/login')
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />

        <button
          type="button"
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          <span className="menu-icon" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>

        <nav
          id="main-navigation"
          className={`main-nav${menuOpen ? ' menu-open' : ''}`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/about" onClick={closeMenu}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={closeMenu}>
            Contact
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={closeMenu}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink)' }}>
                {user?.name}
                {isAdmin && (
                  <span style={{ 
                    marginLeft: '6px', 
                    padding: '2px 6px', 
                    fontSize: '9px', 
                    fontWeight: '700', 
                    background: '#e0f2fe', 
                    color: '#0369a1', 
                    borderRadius: '4px' 
                  }}>
                    ADMIN
                  </span>
                )}
              </span>
              <button
                className="button button-small button-quiet"
                style={{ border: '1px solid var(--line)', padding: '0 12px' }}
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link
                className="login-link"
                to="/login"
                onClick={closeMenu}
              >
                Log in
              </Link>

              <Link
                className="button button-small button-dark"
                to="/register"
                onClick={closeMenu}
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()

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
        <span className="copyright">
          © {currentYear} Forma
        </span>
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
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default SiteLayout
