
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

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
          {menuOpen ? '✕' : '☰'}
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
        </nav>

        <div className="header-actions">
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

