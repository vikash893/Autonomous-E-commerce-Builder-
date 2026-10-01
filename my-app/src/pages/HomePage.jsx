import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'

function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> THE STORE BUILDER FOR WHAT’S NEXT</span>
          <h1>Your next big thing,<br /><span>in its element.</span></h1>
          <p>Build a storefront with your fingerprints all over it. From first product to first thousand customers, Forma helps you move at your own pace.</p>
          <div className="hero-actions"><Link className="button button-dark" to="/register">Build your store <span aria-hidden="true">↗</span></Link><Link className="text-link" to="/about">See what we’re about <span aria-hidden="true">→</span></Link></div>
        </div>
        <div className="hero-visual"><img src={heroImage} alt="" /><span className="hero-image-caption">A good idea starts somewhere.</span></div>
      </section>
      <section className="home-pillars">
        <article><span>01</span><h2>Start with an idea.</h2><p>Bring the thing you’ve been thinking about into focus.</p></article>
        <article><span>02</span><h2>Shape it your way.</h2><p>Build a storefront that feels like it belongs to you.</p></article>
        <article><span>03</span><h2>Take it out there.</h2><p>Open the doors when your work is ready to meet the world.</p></article>
      </section>
      <section className="home-cta"><span className="eyebrow eyebrow-light">YOUR IDEA HAS PLACES TO GO</span><div className="cta-row"><h2>Let’s make it<br />a real thing.</h2><Link className="button button-lime" to="/register">Start building <span aria-hidden="true">↗</span></Link></div><span className="cta-mark" aria-hidden="true">✳</span></section>
    </>
  )
}

export default HomePage