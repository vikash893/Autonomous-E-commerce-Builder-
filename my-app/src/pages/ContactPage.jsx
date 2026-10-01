import { useState } from 'react'

function ContactPage() {
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('Thanks for reaching out. Connect this form to your preferred contact API to send your message.')
  }

  return (
    <section className="contact-page">
      <div className="contact-copy"><span className="eyebrow"><span className="eyebrow-dot" /> WE’RE ALL EARS</span><h1>Let’s talk<br /><span>good things.</span></h1><p>Questions about getting started, your store, or whether Forma is the right fit? Send a note and we’ll point you in the right direction.</p><div className="contact-detail"><span>GET IN TOUCH</span><p>Use the form to share your question. Connect it to your contact API when you’re ready.</p></div></div>
      <form className="contact-form" onSubmit={handleSubmit}><span className="eyebrow">SEND A NOTE</span><h2>What’s on your mind?</h2><label className="field-label" htmlFor="contact-name">Your name<input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Jane Smith" required /></label><label className="field-label" htmlFor="contact-email">Email address<input id="contact-email" name="email" type="email" autoComplete="email" placeholder="jane@example.com" required /></label><label className="field-label" htmlFor="contact-message">Your message<textarea id="contact-message" name="message" rows="5" placeholder="Tell us a little about it..." required /></label><button className="button button-dark" type="submit">Send your message <span aria-hidden="true">↗</span></button>{message && <p className="form-message" role="status">{message}</p>}</form>
    </section>
  )
}

export default ContactPage