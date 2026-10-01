import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Auto-redirect if already logged in
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      } catch {}
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', isError: false });

    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      const isAdmin = data?.user?.role === 'ADMIN';

      if (isAdmin) {
        setMsg({
          text: `👑 Welcome Administrator ${data.user.name}! Redirecting to Admin Dashboard...`,
          isError: false,
        });
        setTimeout(() => {
          window.location.href = '/admin';
        }, 600);
      } else {
        setMsg({
          text: `👋 Welcome back, ${data?.user?.name || 'Customer'}! Redirecting to your Dashboard...`,
          isError: false,
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Login failed. Check your credentials.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '36px 28px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', textAlign: 'center', color: '#0f172a' }}>Sign In</h2>
      <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 24px 0' }}>
        Log in with your credentials to continue
      </p>

      {msg.text && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '8px',
          marginBottom: '18px',
          fontSize: '14px',
          background: msg.isError ? '#fef2f2' : '#f0fdf4',
          color: msg.isError ? '#b91c1c' : '#15803d',
          border: `1px solid ${msg.isError ? '#fecaca' : '#bbf7d0'}`,
          fontWeight: 500,
        }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#334155' }}>
            Email Address
          </label>
          <input
            required
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#334155' }}>
            Password
          </label>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            background: 'var(--primary, #4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px',
          }}
        >
          {loading ? 'Signing In...' : 'Sign In →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
        Don't have an account yet?{' '}
        <Link to="/signup" style={{ color: 'var(--primary, #4f46e5)', fontWeight: 600, textDecoration: 'none' }}>
          Create an Account
        </Link>
      </div>

      <div style={{ marginTop: '28px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
        <strong>🔑 Quick Demo Login Credentials:</strong>
        <div style={{ marginTop: '6px' }}>
          <strong>Admin Account:</strong> <code>admin@demo.com</code> / <code>Admin@123</code><br />
          <em>(Auto-redirects to Admin Dashboard with full CRUD)</em>
        </div>
        <div style={{ marginTop: '6px' }}>
          <strong>Customer Account:</strong> <code>customer@demo.com</code> / <code>Customer@123</code><br />
          <em>(Auto-redirects to Storefront & Catalog)</em>
        </div>
      </div>
    </div>
  );
}
