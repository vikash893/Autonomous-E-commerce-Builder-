import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (!form.name || !form.email || !form.password) {
      setMsg({ text: 'All fields are required', isError: true });
      return;
    }
    if (form.password.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    setLoading(true);
    setMsg({ text: '', isError: false });

    try {
      const data = await request('/auth/register', {
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

      setMsg({
        text: `Account created successfully! Welcome, ${data?.user?.name || form.name}!`,
        isError: false,
      });

      setTimeout(() => {
        window.location.href = isAdmin ? '/admin' : '/dashboard';
      }, 700);
    } catch (err) {
      setMsg({ text: err.message || 'Registration failed', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: '36px 28px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', textAlign: 'center', color: '#0f172a' }}>Create an Account</h2>
      <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 24px 0' }}>Join us to start shopping and tracking your orders</p>

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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#334155' }}>Full Name</label>
          <input
            required
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#334155' }}>Email Address</label>
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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#334155' }}>Password (6+ chars)</label>
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
          {loading ? 'Creating Account...' : 'Sign Up →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary, #4f46e5)', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
