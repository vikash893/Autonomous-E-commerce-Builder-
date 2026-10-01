import { Link } from 'react-router-dom'

const products = [
  { name: 'Everyday tote', category: 'Accessories', price: '$38.00', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=360&q=85', alt: 'Canvas tote bag' },
  { name: 'Sunday ceramics', category: 'Home goods', price: '$54.00', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=360&q=85', alt: 'Handmade ceramic vase' },
  { name: 'Field notes', category: 'Stationery', price: '$16.00', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=360&q=85', alt: 'Notebook and stationery' },
]

function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> THE STORE BUILDER FOR WHAT’S NEXT</span>
          <h1>Your next big thing,<br /><span>in its element.</span></h1>
          <p>Build a storefront with your fingerprints all over it. From first product to first thousand customers, Forma helps you move at your own pace.</p>
          <div className="hero-actions"><Link className="button button-dark" to="/register">Build your store <span aria-hidden="true">↗</span></Link><Link className="text-link" to="/about">See what we’re about <span aria-hidden="true">→</span></Link></div>
          <div className="hero-proof"><div className="proof-avatars" aria-hidden="true"><span>J</span><span>M</span><span>A</span></div><p><strong>Built for the boldly independent.</strong><br />From idea to open for business.</p></div>
        </div>
        <div className="store-preview" aria-label="Preview of an online storefront built with Forma">
          <div className="preview-bar"><span className="preview-dots"><i /><i /><i /></span><span className="preview-url">your-next-thing.forma.store</span><span className="preview-share">↗</span></div>
          <div className="preview-shop">
            <div className="shop-heading"><span className="shop-wordmark">GOOD<br />THINGS<span>.</span></span><div className="shop-links"><span>Shop</span><span>Our story</span><span>Bag (0)</span></div></div>
            <div className="shop-banner"><div className="banner-copy"><span>OBJECTS FOR SLOWER DAYS</span><strong>Find your<br />everyday.</strong><button type="button">EXPLORE THE COLLECTION <span>↗</span></button></div><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1000&q=85" alt="Thoughtfully arranged home objects" /></div>
            <div className="shop-caption"><span>Made to be lived with.</span><span>01 — 03</span></div>
          </div>
          <div className="preview-sticker"><span>YOUR<br />STORE,<br /><b>YOUR<br />RULES.</b></span><i>✳</i></div>
        </div>
      </section>
      <section className="trusted-strip"><span>LESS BUSYWORK. MORE BUSINESS.</span><div><b>Thoughtfully simple</b><i /> <b>Made to grow</b><i /> <b>Always yours</b></div></section>
      <section className="products-section">
        <div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>From your desk<br />to their doorstep.</h2></div><p>Every great store starts with something worth sharing. Put your products in the spotlight and give people a reason to come back.</p></div>
        <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.name}><div className="product-image"><img src={product.image} alt={product.alt} loading="lazy" /><span>0{index + 1}</span></div><div className="product-details"><div><h3>{product.name}</h3><p>{product.category}</p></div><span>{product.price}</span></div></article>)}</div>
      </section>
      <section className="home-cta"><span className="eyebrow eyebrow-light">YOUR IDEA HAS PLACES TO GO</span><div className="cta-row"><h2>Let’s make it<br />a real thing.</h2><Link className="button button-lime" to="/register">Start building <span aria-hidden="true">↗</span></Link></div><span className="cta-mark" aria-hidden="true">✳</span></section>
    </>
  )
}

export default HomePage