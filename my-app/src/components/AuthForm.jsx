import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthBrand } from './SiteLayout.jsx'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear old messages when user starts correcting the form
    setMessage('')
    setError('')
  }

  function validateForm() {
    const email = formData.email.trim()

    if (isRegister && !formData.name.trim()) {
      return 'Please enter your name.'
    }

    if (!email) {
      return 'Please enter your email address.'
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address.'
    }

    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters.'
    }

    if (isRegister && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const endpoint = isRegister
        ? 'http://localhost:8000/api/auth/register'
        : 'http://localhost:8000/api/auth/login'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Authentication failed.')
      }

      if (isRegister) {
        setMessage('Account created successfully. Redirecting to login...')

        setTimeout(() => {
          navigate('/login')
        }, 1000)
      } else {
        // Store JWT token from login response
        localStorage.setItem('token', data.token)

        setMessage('Login successful. Welcome back!')

        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <AuthBrand />

        <div className="auth-story-copy">
          <span className="eyebrow eyebrow-light">
            YOUR NEXT CHAPTER, BUILT IN
          </span>

          <h1>Good ideas deserve a great store.</h1>

          <p>
            Bring your products, your point of view, and a little ambition.
            We’ll make space for the rest.
          </p>
        </div>

        <div className="auth-story-note">
          <span className="story-spark">✳</span>

          <span>
            Made for independent minds
            <br />
            and growing businesses.
          </span>
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-mobile-brand">
          <AuthBrand />
        </div>

        <div className="auth-card">
          <span className="eyebrow">
            {isRegister ? 'START SOMETHING GOOD' : 'WELCOME BACK'}
          </span>

          <h2>
            {isRegister ? 'Create your account' : 'Log in to Forma'}
          </h2>

          <p className="auth-intro">
            {isRegister
              ? 'A better way to build your online store starts here.'
              : 'Pick up where you left off.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <label className="field-label" htmlFor="name">
                Name
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

            <label className="field-label" htmlFor="email">
              Email address
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field-label" htmlFor="password">
              Password
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  placeholder="At least 8 characters"
                  minLength="8"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {isRegister && (
              <label className="field-label" htmlFor="confirmPassword">
                Confirm password
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    minLength="8"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
            )}

            {!isRegister && (
              <div className="form-meta">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />{' '}
                  Remember me
                </label>

                <a href="#forgot" className="forgot-link">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              className="button button-dark auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? 'Creating account...'
                  : 'Logging in...'
                : isRegister
                ? 'Create account'
                : 'Log in'}{' '}
              <span aria-hidden="true">↗</span>
            </button>

            {error && (
              <p
                className="form-message"
                role="alert"
                style={{ color: '#c62828' }}
              >
                {error}
              </p>
            )}

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </form>

          <p className="auth-switch">
            {isRegister
              ? 'Already have an account?'
              : 'New to Forma?'}

            {' '}

            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>

          <Link className="back-home" to="/">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}

export default AuthForm
