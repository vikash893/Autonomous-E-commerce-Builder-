import { Link } from 'react-router-dom'
import { AuthBrand } from './SiteLayout.jsx'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'

  function handleSubmit(event) {
    event.preventDefault()
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <AuthBrand />
        <div className="auth-story-copy">
          <span className="eyebrow eyebrow-light">YOUR NEXT CHAPTER, BUILT IN</span>
          <h1>Good ideas deserve a great store.</h1>
          <p>Bring your products, your point of view, and a little ambition. We’ll make space for the rest.</p>
        </div>
        <div className="auth-story-note"><span className="story-spark">✳</span><span>Made for independent minds<br />and growing businesses.</span></div>
      </section>

      <section className="auth-main">
        <div className="auth-mobile-brand"><AuthBrand /></div>
        <div className="auth-card">
          <span className="eyebrow">{isRegister ? 'START SOMETHING GOOD' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Create your account' : 'Log in to Forma'}</h2>
          <p className="auth-intro">{isRegister ? 'A better way to build your online store starts here.' : 'Pick up where you left off.'}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && <label className="field-label" htmlFor="name">Name<input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>}
            <label className="field-label" htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label className="field-label" htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 8 characters" minLength="8" required /></label>
            {!isRegister && <div className="form-meta"><label className="remember-label"><input type="checkbox" name="remember" /> Remember me</label></div>}
            <button className="button button-dark auth-submit" type="submit">{isRegister ? 'Create account' : 'Log in'} <span aria-hidden="true">↗</span></button>
          </form>
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Forma?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
          <Link className="back-home" to="/">← Back to home</Link>
        </div>
      </section>
    </main>
  )
}

export default AuthForm