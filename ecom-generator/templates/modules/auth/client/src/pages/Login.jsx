import { useState } from 'react';
import { request } from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('token', data.token);
      setMsg(`Welcome ${data.user.name}`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
      <h2>Login</h2>
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Login</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
