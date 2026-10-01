import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Autonomous E-commerce Builder">
      <span className="brand-mark" aria-hidden="true">
        A
      </span>
      <span className="brand-text">
        autonomous<span className="brand-accent"> / builder</span>
      </span>
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <header className={`site-header ${isAuthenticated ? 'site-header-auth' : 'site-header-public'}`}>
      <div className="header-inner">
        <Brand />

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`main-nav ${menuOpen ? 'menu-open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/build" onClick={() => setMenuOpen(false)}>
            Builder
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
              Workspace
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-nav-wrap">
              <span className="user-tag">
                {user?.name}
                {isAdmin && <span className="badge badge-teal">ADMIN</span>}
              </span>
              <button
                type="button"
                className="button button-small button-quiet"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="guest-nav-wrap">
              <Link to="/login" className="login-link">
                Sign in
              </Link>
              <Link to="/build" className="button button-small button-teal">
                Start building <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Brand />
        <p className="footer-copy">
          Autonomous E-commerce Builder · MERN Code Generation Engine (Problem Statement 06)
        </p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/build">Builder</Link>
          <Link to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? 'Workspace' : 'Sign in'}</Link>
        </div>
      </div>
    </footer>
  );
}

export function AuthBrand() {
  return <Brand />;
}

export default function SiteLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
