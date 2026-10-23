import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ClipboardList, FileText, GraduationCap, Image as ImageIcon, Menu, MessageCircle, Monitor, ScanText, ShieldCheck, Sparkles, X } from 'lucide-react'
import { config } from './config'

type OrderForm = { name: string; email: string; whatsapp: string; service: string; budget: string; deadline: string; requirements: string }
const initialForm: OrderForm = { name: '', email: '', whatsapp: '', service: 'Professional Resume Creation', budget: '₹49 – ₹149', deadline: '', requirements: '' }
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const formatPhone = (n: string) => (n.length === 12 && n.startsWith('91') ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : `+${n}`)
const icons = [FileText, ScanText, Monitor, GraduationCap, Sparkles, ImageIcon]
const portfolioItems: { category: string; name: string; role: string; type: string; color: string; initials: string; tags: string[]; url?: string }[] = [
  { category: 'Developer Portfolios', name: 'Ujjwal Pratap', role: 'Personal Portfolio Website', type: 'SATISFIED CUSTOMER', color: 'blue', initials: 'UP', tags: ['Live portfolio', 'Projects', 'Skills'], url: 'https://ujjwalpratap001.github.io/ujjwal-portfolio/' }
]
const terms: [string, string][] = [
  ['Enquiry is not an order', 'Messaging us on WhatsApp or filling the Google Form is only an enquiry. Work begins after scope, price and timeline are confirmed with you on WhatsApp.'],
  ['Payment', 'The price and any advance are confirmed before work starts. Final files are delivered after full payment.'],
  ['Changes after delivery', `Portfolio websites: changes are free for ${config.freeChangeDays} days after delivery. After that, any further changes cost ${money(config.correctionPrice)}. Resume changes are agreed with you on WhatsApp.`],
  ['Timeline', 'Delivery time depends on the service and on how quickly you share your details and feedback. Delays from your side move the deadline.'],
  ['Your information', 'The details you share must be accurate and yours to share. We use them only to complete your work and never sell or publish them.'],
  ['Refunds & cancellation', 'Once work has started, the advance paid is non-refundable. If we are unable to deliver your work, you get a refund of the amount paid.'],
  ['Ownership', 'After full payment, the final resume or portfolio is yours to use. We may show the work in our samples only with your permission.'],
  ['No guarantees', 'We do not guarantee interviews, job offers or ATS results. Sample styles on this site are illustrative and are not client work.'],
  ['Contact', `Questions about these terms: ${config.email} or WhatsApp.`]
]
const trustPoints = [
  ['Free to enquire', 'WhatsApp or Google Form — no payment needed to start the conversation.'],
  ['Clear scope first', 'Price and timeline are confirmed with you before any work begins.'],
  ['Honest pricing', 'What you see is what you pay. Changes after delivery are stated upfront.'],
  ['Real deliveries', 'Live portfolios from satisfied customers — not stock mockups.']
]
const steps = [
  ['01', 'Choose your service', 'Pick the resume or portfolio support that fits your next move.'],
  ['02', 'Share your details', 'Tell us on WhatsApp or fill the Google Form with your goals and deadline.'],
  ['03', 'We design your story', 'We shape your information into a clear, polished and professional experience.'],
  ['04', 'Review & receive', 'Review the work, request included revisions, and receive your final files or website.']
]
const teamMembers: { name: string; role: string; initials: string }[] = []

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All work')
  const [preview, setPreview] = useState<typeof portfolioItems[number] | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [form, setForm] = useState<OrderForm>(initialForm)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    document.body.style.overflow = orderOpen || preview ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [orderOpen, preview])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        doc.style.setProperty('--scroll', p.toFixed(4))
        const stepEls = document.querySelectorAll<HTMLElement>('.step[data-step]')
        let best = 0
        stepEls.forEach((el, i) => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.55) best = i
        })
        setActiveStep(best)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in')
        observer.unobserve(en.target)
      }
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    document.querySelectorAll<HTMLElement>('.section-head, .service-card, .step, .filters, .cta-inner, .work-card, .price-note, .terms-list li, .team-card').forEach((el, i) => {
      el.classList.add('reveal')
      el.style.setProperty('--reveal-delay', `${(i % 6) * 55}ms`)
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!orderOpen && !preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOrderOpen(false)
      setPreview(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [orderOpen, preview])

  const filtered = useMemo(
    () => (activeCategory === 'All work' ? portfolioItems : portfolioItems.filter((i) => i.category === activeCategory)),
    [activeCategory]
  )
  const categories = ['All work', ...Array.from(new Set(portfolioItems.map((i) => i.category)))]

  const whatsappUrl = (message: string) =>
    `https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

  const openOrder = (serviceHint?: string) => {
    if (serviceHint) setForm((f) => ({ ...f, service: serviceHint }))
    setOrderOpen(true)
  }

  const submitToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault()
    const lines = [
      `Hi ${config.brand},`,
      `I want to enquire about: ${form.service}`,
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `WhatsApp: ${form.whatsapp}`,
      `Budget: ${form.budget}`,
      form.deadline ? `Deadline: ${form.deadline}` : '',
      form.requirements ? `Requirements: ${form.requirements}` : ''
    ].filter(Boolean)
    window.open(whatsappUrl(lines.join('\n')), '_blank', 'noopener,noreferrer')
    setOrderOpen(false)
    setForm(initialForm)
  }

  const formReminder = (align: 'left' | 'center' = 'left') => (
    <div className="form-reminder on-light" style={align === 'center' ? { justifyContent: 'center' } : undefined}>
      <MessageCircle size={16} />
      <span>Filled the Google Form? Please also <a href={whatsappUrl('Hi, I have filled the Google Form.')} target="_blank" rel="noopener noreferrer">send a quick message on WhatsApp</a> so we can spot it.</span>
    </div>
  )

  return (
    <div className="app">
      <div className="scroll-progress" aria-hidden="true" />
      <div className="notice-bar" role="status">
        <span className="notice-dot" aria-hidden="true" />
        <p><strong>Website under construction</strong> — enquire anytime on <a href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer">WhatsApp</a> or the <a href={config.googleFormUrl} target="_blank" rel="noopener noreferrer">Google Form</a>.</p>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">{config.brand}</a>
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
            <button className="btn btn-primary" onClick={() => { setMenuOpen(false); openOrder() }}>Get started</button>
          </nav>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-mist" />
          <div className="hero-art" />
        </div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line"></span> PERSONAL BRANDING STUDIO</div>
            <h1>Stand out.<br /><span>Get noticed.</span><br />Get hired.</h1>
            <p className="hero-lead">We craft resumes, portfolio websites and posters that make your skills easy to see — for students, freshers and professionals.</p>
            <div className="hero-actions">
              <button className="btn btn-whatsapp" onClick={() => openOrder()}><MessageCircle size={18} /> Start on WhatsApp</button>
              <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> Let's build your future</a>
            </div>
            <p className="hero-trust"><ShieldCheck size={16} /> Enquire free · Pay only after scope is clear on WhatsApp</p>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Why people trust us">
        <div className="container trust-grid">
          {trustPoints.map(([t, d]) => (
            <div key={t} className="trust-item">
              <div className="trust-icon"><ShieldCheck size={18} /></div>
              <div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> SERVICES</div>
            <h2>What we help you ship</h2>
            <p>Pick a service. Message on WhatsApp or fill the Google Form — no payment required to enquire.</p>
          </div>
          <div className="service-grid">
            {config.services.map((s, i) => {
              const Icon = icons[i] || FileText
              const note = 'note' in s ? (s as { note?: string }).note : undefined
              const originalPrice = 'originalPrice' in s ? (s as { originalPrice?: number }).originalPrice : undefined
              return (
                <article key={s.title} className="service-card">
                  <div className="service-icon"><Icon size={22} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="service-price">
                    <span className="old-price">{money(originalPrice ?? s.price)}</span>
                    <span className="new-price">{money(s.price)}</span>
                  </div>
                  {note && <p className="service-note">{note}</p>}
                  <button className="text-link" onClick={() => openOrder(s.title)}>Enquire on WhatsApp <ArrowRight size={14} /></button>
                </article>
              )
            })}
          </div>
          <p className="price-note">Limited offer: Resumes from {money(config.services[0].price)} · Posters from {money(49)} · Portfolio websites from {money(config.services[2].price)}. Portfolio changes free for {config.freeChangeDays} days after delivery.</p>
        </div>
      </section>

      <section id="work" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> OUR WORK</div>
            <h2>Live portfolios</h2>
            <p>Real work we have shipped. Click a card to open the live site. More coming soon.</p>
          </div>
          <div className="filters">
            {categories.map((c) => (
              <button key={c} className={activeCategory === c ? 'active' : ''} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="work-grid">
            {filtered.map((item) => (
              <button
                key={item.name}
                className={`work-card color-${item.color}`}
                onClick={() => {
                  if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
                  else setPreview(item)
                }}
              >
                <div className="work-avatar">{item.initials}</div>
                <div className="work-meta">
                  <span className="work-type">{item.type}</span>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="work-cta-row">
            <button className="btn btn-whatsapp" onClick={() => openOrder()}><MessageCircle size={18} /> Enquire on WhatsApp</button>
            <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> Let's build your future</a>
          </div>

          <blockquote className="testimonial">
            <p>“Clean portfolio, delivered on time. Easy to share with recruiters.”</p>
            <footer>
              <strong>Ujjwal Pratap</strong>
              <span>Satisfied customer · <a href="https://ujjwalpratap001.github.io/ujjwal-portfolio/" target="_blank" rel="noopener noreferrer">View live site</a></span>
            </footer>
          </blockquote>
        </div>
      </section>

      <section id="process" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> PROCESS</div>
            <h2>How it works</h2>
          </div>
          <div className="steps">
            {steps.map(([n, t, d], i) => (
              <div key={n} className={`step ${activeStep === i ? 'step-active' : ''}`} data-step={i}>
                <div className="step-num">{n}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <div className="eyebrow"><span className="eyebrow-line"></span> YOUR NEXT CHAPTER STARTS HERE</div>
          <h2>Your skills are real.<br /><span>Let’s make them visible.</span></h2>
          <p>Message on WhatsApp or fill the form — resume, portfolio, poster, or both.</p>
          <div className="cta-actions">
            <button className="btn btn-whatsapp btn-lg" onClick={() => openOrder()}><MessageCircle size={20} /> WhatsApp enquiry</button>
            <a className="btn btn-form btn-lg" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={20} /> Let's build your future</a>
          </div>
          {formReminder('center')}
        </div>
      </section>

      <section id="terms" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> TERMS</div>
            <h2>Terms &amp; Conditions</h2>
            <p>These terms apply when you work with us.</p>
          </div>
          <ol className="terms-list">
            {terms.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
          </ol>
        </div>
      </section>

      <section id="team" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> OUR TEAM</div>
            <h2>Our Team</h2>
            <p>The people behind the work.</p>
          </div>
          {teamMembers.length > 0 ? (
            <div className="team-grid">
              {teamMembers.map((m) => (
                <article key={m.name} className="team-card">
                  <div className="team-avatar" aria-hidden="true">{m.initials}</div>
                  <h3>{m.name}</h3>
                  <p>{m.role}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="team-grid">
              <article className="team-card team-card-placeholder">
                <div className="team-avatar" aria-hidden="true">+</div>
                <h3>Coming soon</h3>
                <p>Team profiles will appear here.</p>
              </article>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <strong>{config.brand}</strong>
            <p>Resumes · Portfolios · Posters · Personal branding</p>
            <p className="footer-trust">Enquire free on WhatsApp. Scope &amp; price confirmed before work starts.</p>
          </div>
          <div className="footer-contact">
            <p><strong>Contact</strong></p>
            <a href={"mailto:" + config.email}>{config.email}</a>
            <a href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer">WhatsApp: {formatPhone(config.whatsapp)}</a>
            <a href={config.googleFormUrl} target="_blank" rel="noopener noreferrer">Google Form</a>
          </div>
          <div className="footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="#terms">T&amp;C on this page</a>
          </div>
        </div>
      </footer>

      <div className="contact-dock" aria-label="Quick contact">
        <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> <span>Let's build your future</span></a>
        <a className="btn btn-whatsapp" href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> <span>WhatsApp</span></a>
      </div>

      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreview(null)}><X size={18} /></button>
            <div className={`work-avatar large color-${preview.color}`}>{preview.initials}</div>
            <h3 id="preview-title">{preview.name}</h3>
            <p>{preview.role}</p>
            <div className="tags">{preview.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <p className="muted">Want a portfolio like this made for you?</p>
            <div className="modal-actions">
              <button className="btn btn-whatsapp" onClick={() => { setPreview(null); openOrder() }}><MessageCircle size={18} /> WhatsApp enquiry</button>
              <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> Let's build your future</a>
            </div>
          </div>
        </div>
      )}

      {orderOpen && (
        <div className="modal-backdrop" onClick={() => setOrderOpen(false)}>
          <div className="modal order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOrderOpen(false)}><X size={18} /></button>
            <h2 id="order-title">WhatsApp enquiry</h2>
            <p className="muted">Fill details — WhatsApp opens with your message ready. Or use the Google Form instead.</p>
            <form className="order-form" onSubmit={submitToWhatsApp}>
              <div className="form-grid">
                <label>Full name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" autoComplete="name" maxLength={80} /></label>
                <label>Email address *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" maxLength={120} /></label>
                <label>WhatsApp number *<input required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91 98XXXXXXXX" autoComplete="tel" inputMode="tel" pattern="[0-9+\s\-]{8,18}" title="Enter a valid phone number, e.g. +91 98XXXXXXXX" maxLength={18} /></label>
                <label>Service required *
                  <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {config.services.map((s) => <option key={s.title}>{s.title}</option>)}
                  </select>
                </label>
                <label>Approx. budget
                  <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                    <option>₹49 – ₹149</option>
                    <option>Flexible / discuss</option>
                  </select>
                </label>
                <label>Preferred deadline<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} min={localToday()} /></label>
                <label className="full-field">Additional requirements<textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Goals, current resume, preferred style, links..." rows={4} maxLength={1000} /></label>
              </div>
              <div className="form-submit-row">
                {formReminder()}
                <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> Let's build your future</a>
                <button className="btn btn-whatsapp" type="submit"><MessageCircle size={18} /> Send on WhatsApp</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
