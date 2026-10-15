import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, FileText, GraduationCap, Menu, Monitor, ScanText, ShieldCheck, Sparkles, X } from 'lucide-react'
import { config } from './config'

type OrderForm = { name: string; email: string; whatsapp: string; service: string; budget: string; deadline: string; requirements: string }
const initialForm: OrderForm = { name: '', email: '', whatsapp: '', service: 'Professional Resume Creation', budget: '₹599 – ₹999', deadline: '', requirements: '' }
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const icons = [FileText, ScanText, Monitor, GraduationCap, Sparkles]
const portfolioItems = [
  { category: 'Student Portfolios', name: 'Aarav Mehta', role: 'Computer Science Student', type: 'STUDENT', color: 'blue', initials: 'AM', tags: ['Projects', 'Skills', 'Journey'] },
  { category: 'Developer Portfolios', name: 'Riya Kapoor', role: 'Frontend Developer', type: 'DEVELOPER', color: 'purple', initials: 'RK', tags: ['React', 'UI Engineering', 'Open source'] },
  { category: 'Data Analyst Portfolios', name: 'Kabir Singh', role: 'Aspiring Data Analyst', type: 'DATA', color: 'green', initials: 'KS', tags: ['SQL', 'Python', 'Dashboards'] },
  { category: 'Professional Resumes', name: 'Neha Verma', role: 'Business Analyst', type: 'RESUME', color: 'sand', initials: 'NV', tags: ['Experience', 'Impact', 'Education'] },
  { category: 'Creative Portfolios', name: 'Ishaan Rao', role: 'Brand & Visual Designer', type: 'CREATIVE', color: 'pink', initials: 'IR', tags: ['Identity', 'Art direction', 'Selected work'] }
]
const steps = [
  ['01', 'Choose your service', 'Pick the resume or portfolio support that fits your next move.'],
  ['02', 'Share your details', 'Tell us about your goals, experience, projects and deadline on WhatsApp or the form.'],
  ['03', 'We design your story', 'We shape your information into a clear, polished and professional experience.'],
  ['04', 'Review & receive', 'Review the work, request included revisions, and receive your final files or website.']
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All work')
  const [preview, setPreview] = useState<typeof portfolioItems[number] | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [form, setForm] = useState<OrderForm>(initialForm)

  useEffect(() => {
    document.body.style.overflow = orderOpen || preview ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
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

  return (
    <div className="app">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">{config.brand}</a>
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#packages" onClick={() => setMenuOpen(false)}>Packages</a>
            <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
            <button className="btn btn-primary" onClick={() => { setMenuOpen(false); openOrder() }}>Get started</button>
          </nav>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow"><span className="eyebrow-line"></span> PERSONAL BRANDING STUDIO</div>
            <h1>Stand out.<br /><span>Get noticed.</span><br />Get hired.</h1>
            <p className="hero-lead">We craft resumes and portfolio websites that make your skills easy to see — for students, freshers and professionals.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => openOrder()}>Start on WhatsApp <ArrowUpRight size={16} /></button>
              <a className="btn btn-ghost" href="#work">View demo work</a>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top"><ShieldCheck size={18} /> Clear scope · WhatsApp support · Honest pricing</div>
            <ul className="hero-list">
              <li><Check size={16} /> ATS-friendly resume layouts</li>
              <li><Check size={16} /> Mobile-first portfolio sites</li>
              <li><Check size={16} /> All packages under ₹1,000</li>
              <li><Check size={16} /> No fake claims or guarantees</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> SERVICES</div>
            <h2>What we help you ship</h2>
            <p>Pick a service or package. Message us on WhatsApp to start — no payment required to enquire.</p>
          </div>
          <div className="service-grid">
            {config.services.map((s, i) => {
              const Icon = icons[i] || FileText
              return (
                <article key={s.title} className="service-card">
                  <div className="service-icon"><Icon size={22} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="service-price">From {money(s.price)}</div>
                  <button className="text-link" onClick={() => openOrder(s.title)}>Enquire on WhatsApp <ArrowRight size={14} /></button>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="packages" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> PACKAGES</div>
            <h2>Simple bundles</h2>
          </div>
          <div className="package-grid">
            {config.packages.map((p) => (
              <article key={p.id} className={`package-card ${p.featured ? 'featured' : ''}`}>
                {p.featured && <div className="badge">Most popular</div>}
                <h3>{p.name}</h3>
                <div className="package-price">{money(p.price)}</div>
                <p>{p.description}</p>
                <ul>{p.features.map((f) => <li key={f}><Check size={15} /> {f}</li>)}</ul>
                <button className="btn btn-primary" onClick={() => openOrder(`${p.name} Package`)}>Choose {p.name}</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> DEMO WORK</div>
            <h2>Illustrative gallery</h2>
            <p>These are demo examples, not client work. Want a portfolio like this? Connect on WhatsApp or share your details below.</p>
          </div>
          <div className="filters">
            {categories.map((c) => (
              <button key={c} className={activeCategory === c ? 'active' : ''} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="work-grid">
            {filtered.map((item) => (
              <button key={item.name} className={`work-card color-${item.color}`} onClick={() => setPreview(item)}>
                <div className="work-avatar">{item.initials}</div>
                <div className="work-meta">
                  <span className="work-type">{item.type} · DEMO</span>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="demo-cta" style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => openOrder('Personal Portfolio Website')}>
              View demo portfolio / Get yours <ArrowUpRight size={16} />
            </button>
            <a className="btn btn-ghost" href={whatsappUrl(`Hi ${config.brand}, I saw the demo portfolios and want one made for me.`)} target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
            {config.googleFormUrl ? (
              <a className="btn btn-ghost" href={config.googleFormUrl} target="_blank" rel="noreferrer">Fill Google Form</a>
            ) : null}
          </div>
        </div>
      </section>

      <section id="process" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> PROCESS</div>
            <h2>How it works</h2>
          </div>
          <div className="steps">
            {steps.map(([n, t, d]) => (
              <div key={n} className="step">
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
          <p>Message on WhatsApp with what you need — resume, portfolio, or both.</p>
          <div className="cta-actions">
            <button className="btn btn-light" onClick={() => openOrder()}>Enquire on WhatsApp <ArrowUpRight size={16} /></button>
            <a className="btn btn-ghost-light" href={whatsappUrl(`Hi ${config.brand}, I want to discuss a project.`)} target="_blank" rel="noreferrer">Chat now</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>{config.brand}</strong>
            <p>Resumes · Portfolios · Personal branding</p>
          </div>
          <div className="footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href={`mailto:${config.email}`}>{config.email}</a>
            <a href={whatsappUrl('Hi')} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>

      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreview(null)}><X size={18} /></button>
            <div className={`work-avatar large color-${preview.color}`}>{preview.initials}</div>
            <h3>{preview.name}</h3>
            <p>{preview.role} · <strong>DEMO</strong></p>
            <div className="tags">{preview.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <p className="muted">Illustrative demo — not a real client project. Want something similar?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => { setPreview(null); openOrder('Personal Portfolio Website') }}>
                Get a portfolio like this
              </button>
              <a className="btn btn-ghost" href={whatsappUrl(`Hi ${config.brand}, I liked the ${preview.name} demo style and want a portfolio.`)} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {orderOpen && (
        <div className="modal-backdrop" onClick={() => setOrderOpen(false)}>
          <div className="modal order-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOrderOpen(false)}><X size={18} /></button>
            <h2>WhatsApp enquiry</h2>
            <p className="muted">Fill the details — we’ll open WhatsApp with your message ready. No account or payment needed to enquire.</p>
            <form className="order-form" onSubmit={submitToWhatsApp} noValidate>
              <div className="form-grid">
                <label>Full name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" autoComplete="name" /></label>
                <label>Email address *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></label>
                <label>WhatsApp number *<input required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91 98XXXXXXXX" autoComplete="tel" /></label>
                <label>Service required *
                  <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {config.services.map((s) => <option key={s.title}>{s.title}</option>)}
                    {config.packages.map((p) => <option key={p.id} value={`${p.name} Package`}>{p.name} Package</option>)}
                  </select>
                </label>
                <label>Approx. budget
                  <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                    <option>₹599 – ₹999</option>
                    <option>Flexible / discuss</option>
                  </select>
                </label>
                <label>Preferred deadline<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} min={new Date().toISOString().slice(0, 10)} /></label>
                <label className="full-field">Additional requirements<textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Goals, current resume, preferred style, links..." rows={4} /></label>
              </div>
              <div className="form-submit-row">
                <p>Opens WhatsApp with your enquiry. You can also email <a href={`mailto:${config.email}`}>{config.email}</a>.</p>
                <button className="btn btn-primary" type="submit">Send on WhatsApp <ArrowUpRight size={16} /></button>
              </div>
              {config.googleFormUrl ? (
                <p className="form-hint" style={{ marginTop: '12px' }}>
                  Prefer a form? <a href={config.googleFormUrl} target="_blank" rel="noreferrer">Open Google Form ↗</a>
                </p>
              ) : (
                <small className="form-hint">Google Form link can be added later in config.</small>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
