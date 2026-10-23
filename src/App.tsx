import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ClipboardList, FileText, GraduationCap, Globe, Image as ImageIcon, Menu, MessageCircle, Monitor, ScanText, ShieldCheck, Sparkles, X } from 'lucide-react'
import { config } from './config'

type OrderForm = { name: string; email: string; whatsapp: string; service: string; budget: string; deadline: string; requirements: string }
const initialForm: OrderForm = { name: '', email: '', whatsapp: '', service: 'Professional Resume Creation', budget: 'Discuss on WhatsApp', deadline: '', requirements: '' }
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const formatPhone = (n: string) => (n.length === 12 && n.startsWith('91') ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : `+${n}`)
const icons = [FileText, ScanText, Monitor, GraduationCap, Sparkles, ImageIcon]
const portfolioItems: { category: string; name: string; role: string; type: string; color: string; initials: string; tags: string[]; url?: string }[] = []
const terms: [string, string][] = [
  ['Enquiry', 'Work starts after scope and timeline are confirmed on WhatsApp.'],
  ['Payment', 'Pricing is confirmed on WhatsApp. Final files are delivered after full payment.'],
  ['Revisions', 'Extra changes after delivery may involve additional charges.'],
  ['Timeline', 'Delays in sharing details or feedback may delay delivery.'],
  ['Privacy', 'Your information is kept private and never sold or shared without permission.'],
  ['Refunds', 'Advance payments are non-refundable once work starts. If we fail to deliver, you get a refund.'],
  ['Ownership', 'Final work belongs to you after payment. We showcase it only with your permission.'],
  ['Disclaimer', 'We do not guarantee jobs, interviews, or ATS results.'],
  ['Contact', 'EMAIL_OR_WHATSAPP']
]
const trustPoints = [
  ['Quick to start', 'Tap a service and chat with us on WhatsApp. Nothing to fill in.'],
  ['Clear scope first', 'Scope and timeline are confirmed with you before any work begins.'],
  ['Honest communication', 'We tell you upfront what to expect and keep you updated.'],
  ['Real deliveries', 'Work shaped around your goals — not generic templates.']
]
const steps = [
  ['01', 'Choose your service', 'Pick the resume or portfolio support that fits your next move.'],
  ['02', 'Share your details', 'Tell us on WhatsApp or fill the Google Form with your goals and deadline.'],
  ['03', 'We design your story', 'We shape your information into a clear, polished and professional experience.'],
  ['04', 'Review & receive', 'Review the work, request included revisions, and receive your final files or website.']
]
const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
const teamMembers: { name: string; role: string; bio: string; photo?: string; linkedin: string; portfolio: string }[] = [
  {
    name: 'Prince Tyagi',
    role: 'Co-Founder',
    photo: '/team/prince-tyagi.jpg',
    linkedin: 'https://www.linkedin.com/in/prince-tyagi-2147482',
    portfolio: 'https://prince-tyagi-portfolio.pages.dev/',
    bio: 'Works with the founder to plan projects and keep timelines on track. Focused on clear communication, so you always know what happens next.'
  },
  {
    name: 'Anant Goyal',
    role: 'Founder',
    photo: '/team/anant-goyal.jpg',
    linkedin: 'https://www.linkedin.com/in/anant-goyal-417b8137',
    portfolio: 'https://anantgoyalportfolio.vercel.app/',
    bio: "Started AP Creative Studio to help students and freshers show their skills with confidence. Sets the studio's direction and keeps the quality of every delivery high."
  },
  {
    name: 'Ujjwal Pratap Singh',
    role: 'Chief Executive Officer',
    photo: '/team/ujjwal-pratap-singh.jpg',
    linkedin: 'https://www.linkedin.com/in/ujjwalpratap624604',
    portfolio: 'https://ujjwalpratap001.github.io/ujjwal-portfolio/',
    bio: "Leads the studio's day-to-day operations and growth. Keeps the focus on honest communication, on-time delivery and a smooth experience for every client."
  }
]
const initialsOf = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All work')
  const [preview, setPreview] = useState<typeof portfolioItems[number] | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [form, setForm] = useState<OrderForm>(initialForm)
  const [activeStep, setActiveStep] = useState(0)
  const [termsOpen, setTermsOpen] = useState(false)

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
  }, [termsOpen])

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

  const openWhatsAppService = (serviceTitle: string) => {
    const msg = `Hi ${config.brand},\nI want to enquire about: ${serviceTitle}`
    window.open(whatsappUrl(msg), '_blank', 'noopener,noreferrer')
  }

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
            <a href="#work" onClick={() => setMenuOpen(false)}>Showcase</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
            <a href="#team" onClick={() => setMenuOpen(false)}>Team</a>
            <button className="btn btn-primary" onClick={() => { setMenuOpen(false); window.open(whatsappUrl('Hi'), '_blank', 'noopener,noreferrer') }}>Get started</button>
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
              <a className="btn btn-whatsapp" href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Start on WhatsApp</a>
              <a className="btn btn-form" href={config.googleFormUrl} target="_blank" rel="noopener noreferrer"><ClipboardList size={18} /> Let's build your future</a>
            </div>
            <p className="hero-trust"><ShieldCheck size={16} /> Chat on WhatsApp · Scope is confirmed with you before work starts</p>
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
            <p>Pick a service. One tap opens WhatsApp with that service ready — no form to fill.</p>
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
                  {config.showPrices && (
                    <div className="service-price">
                      <span className="old-price">{money(originalPrice ?? s.price)}</span>
                      <span className="new-price">{money(s.price)}</span>
                    </div>
                  )}
                  {note && <p className="service-note">{note}</p>}
                  <button type="button" className="btn btn-whatsapp" style={{ marginTop: 'auto', width: '100%' }} onClick={() => openWhatsAppService(s.title)}>
                    <MessageCircle size={18} /> Chat on WhatsApp
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="work" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> SHOWCASE</div>
            <h2>Our Creative Showcase</h2>
            <p>Selected work will appear here soon.</p>
          </div>
          {portfolioItems.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="work-grid">
              <article className="team-card team-card-placeholder" style={{ maxWidth: 320 }}>
                <div className="team-avatar" aria-hidden="true">+</div>
                <h3>Coming soon</h3>
                <p>Creative work will be added here.</p>
              </article>
            </div>
          )}
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
            <a className="btn btn-whatsapp btn-lg" href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} /> WhatsApp enquiry</a>
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
            {(termsOpen ? terms : terms.slice(0, 2)).map(([t, d]) => (
              <li key={t}>
                <strong>{t}</strong>
                <span>
                  {d === 'EMAIL_OR_WHATSAPP' ? (
                    <>
                      <a href={'mailto:' + config.email}>{config.email}</a>
                      {' or '}
                      <a href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </>
                  ) : d}
                </span>
              </li>
            ))}
          </ol>
          {terms.length > 2 && (
            <button
              type="button"
              className="terms-more"
              onClick={() => setTermsOpen((v) => !v)}
              aria-expanded={termsOpen}
            >
              {termsOpen ? 'Show less' : `View more (${terms.length - 2} more)`}
            </button>
          )}
        </div>
      </section>

      <section id="team" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> TEAM</div>
            <h2>Meet Our Team</h2>
            <p>The people behind the work.</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((m) => (
              <article key={m.name} className="team-card team-card-member">
                {m.photo ? (
                  <img className="team-photo" src={m.photo} alt={m.name} width={400} height={400} loading="lazy" decoding="async" />
                ) : (
                  <div className="team-avatar" aria-hidden="true">{initialsOf(m.name)}</div>
                )}
                <h3>{m.name}</h3>
                <span className="team-role">{m.role}</span>
                <p className="team-bio">{m.bio}</p>
                <div className="team-links">
                  <a className="team-link" href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`}><LinkedinIcon size={16} /> LinkedIn</a>
                  <a className="team-link" href={m.portfolio} target="_blank" rel="noopener noreferrer" aria-label={`${m.name}'s portfolio website`}><Globe size={16} /> Portfolio</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <strong>{config.brand}</strong>
            <p>Resumes · Portfolios · Posters · Personal branding</p>
            <p className="footer-trust">Chat on WhatsApp. Scope and details confirmed before work starts.</p>
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
            <p className="muted">Want something like this made for you?</p>
            <div className="modal-actions">
              <a className="btn btn-whatsapp" href={whatsappUrl('Hi')} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> WhatsApp enquiry</a>
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
            <p className="muted">Optional details — or just message us on WhatsApp directly.</p>
            <form className="order-form" onSubmit={submitToWhatsApp}>
              <div className="form-grid">
                <label>Full name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" autoComplete="name" maxLength={80} /></label>
                <label>Email address *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" maxLength={120} /></label>
                <label>WhatsApp number *<input required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91 98XXXXXXXX" autoComplete="tel" inputMode="tel" pattern="[0-9+\s\-]{8,18}" title="Enter a valid phone number" maxLength={18} /></label>
                <label>Service required *
                  <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {config.services.map((s) => <option key={s.title}>{s.title}</option>)}
                  </select>
                </label>
                <label>Approx. budget
                  <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                    <option>Discuss on WhatsApp</option>
                    <option>Flexible</option>
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
