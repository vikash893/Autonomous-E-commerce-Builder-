import { Link } from 'react-router-dom'

function AboutPage() {
  return (
    <>
      <section className="page-intro about-intro"><span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE ABOUT US</span><h1>Business should feel<br /><span>like your business.</span></h1><p>Forma gives independent businesses the tools to show up, sell well, and grow without losing the thing that made them special in the first place.</p></section>
      <section className="about-manifesto">
        <div className="manifesto-image"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1100&q=85" alt="A bright independent shop filled with carefully selected goods" /><span>MADE FOR THE MAKERS</span></div>
        <div className="manifesto-copy"><span className="eyebrow">OUR POINT OF VIEW</span><h2>Less figuring out the software. More doing the thing you love.</h2><p>Starting something of your own takes enough courage. Your tools should make the complicated parts feel clear, and leave you with more room for the work only you can do.</p><p>We bring your storefront, products, and day-to-day essentials into one considered place. No big-business playbook required.</p><Link className="text-link" to="/contact">Come say hello <span aria-hidden="true">→</span></Link></div>
      </section>
      <section className="values-section"><span className="eyebrow">WHAT WE BELIEVE</span><div className="values-grid"><article><span>01</span><h3>Make it yours.</h3><p>Your storefront should feel like an extension of your idea, not a template someone else picked.</p></article><article><span>02</span><h3>Keep it clear.</h3><p>Good tools make the next step obvious and give you your time back.</p></article><article><span>03</span><h3>Grow your way.</h3><p>Whether you’re testing a hunch or scaling up, your business sets the pace.</p></article></div></section>
      <section className="simple-cta"><h2>Have a good thing going?</h2><Link className="button button-dark" to="/register">Make it a store <span aria-hidden="true">↗</span></Link></section>
    </>
  )
}

export default AboutPage