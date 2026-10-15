import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown, Code2, FileText, GraduationCap, Layers3, Linkedin, Menu, Monitor, ScanText, ShieldCheck, Sparkles, Star, X, Zap } from 'lucide-react'
import { config } from './config'

type OrderForm = { name:string; email:string; whatsapp:string; service:string; budget:string; deadline:string; requirements:string }
const initialForm: OrderForm = { name:'', email:'', whatsapp:'', service:'Professional Resume Creation', budget:'₹799 – ₹2,000', deadline:'', requirements:'' }
const money = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)
const icons = [FileText, ScanText, Monitor, GraduationCap, Linkedin, Sparkles, Layers3]
const portfolioItems = [
  { category:'Student Portfolios', name:'Aarav Mehta', role:'Computer Science Student', type:'STUDENT', color:'blue', initials:'AM', tags:['Projects','Skills','Journey'] },
  { category:'Developer Portfolios', name:'Riya Kapoor', role:'Frontend Developer', type:'DEVELOPER', color:'purple', initials:'RK', tags:['React','UI Engineering','Open source'] },
  { category:'Data Analyst Portfolios', name:'Kabir Singh', role:'Aspiring Data Analyst', type:'DATA', color:'green', initials:'KS', tags:['SQL','Python','Dashboards'] },
  { category:'Professional Resumes', name:'Neha Verma', role:'Business Analyst', type:'RESUME', color:'sand', initials:'NV', tags:['Experience','Impact','Education'] },
  { category:'Creative Portfolios', name:'Ishaan Rao', role:'Brand & Visual Designer', type:'CREATIVE', color:'pink', initials:'IR', tags:['Identity','Art direction','Selected work'] }
]
const steps = [
  ['01','Choose your service','Pick the resume, portfolio or personal branding support that fits your next move.'],
  ['02','Share your details','Tell us about your goals, experience, projects, preferences and deadline.'],
  ['03','We design your story','We shape your information into a clear, polished and professional experience.'],
  ['04','Review & receive','Review the work, request included revisions, and receive your final files or website.']
]
function App() {
  const [menuOpen,setMenuOpen] = useState(false)
  const [activeCategory,setActiveCategory] = useState('All work')
  const [preview,setPreview] = useState<typeof portfolioItems[number] | null>(null)
  const [orderOpen,setOrderOpen] = useState(false)
  const [selectedPackage,setSelectedPackage] = useState<string | null>(null)
  const [form,setForm] = useState<OrderForm>(initialForm)
  const [formState,setFormState] = useState<'idle'|'sending'|'success'|'error'>('idle')
  const [formMessage,setFormMessage] = useState('')
  const [currentOrderId,setCurrentOrderId] = useState('')
  const [paymentMessage,setPaymentMessage] = useState('')

  useEffect(()=>{ document.body.style.overflow = orderOpen || preview ? 'hidden' : ''; return ()=>{document.body.style.overflow=''} },[orderOpen,preview])

  const filtered = useMemo(()=> activeCategory === 'All work' ? portfolioItems : portfolioItems.filter(i=>i.category === activeCategory), [activeCategory])
  const categories = ['All work', ...Array.from(new Set(portfolioItems.map(i=>i.category)))]

  const whatsappUrl = (message:string) => `https://wa.me/${config.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`

  const openOrder = (pkg?: string) => {
    setSelectedPackage(pkg || null)
    setOrderOpen(true)
    setFormState('idle')
    setFormMessage('')
    setPaymentMessage('')
  }

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('sending')
    setFormMessage('')
    try {
      if (!config.apiBase) throw new Error('API not configured')
      const res = await fetch(`${config.apiBase}/api/orders`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, packageId:selectedPackage || undefined})})
      if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message || 'Order could not be submitted. Please try WhatsApp instead.') }
      const data = await res.json()
      setCurrentOrderId(data.orderId)
      setFormState('success')
      setFormMessage(`Thanks, ${form.name.split(' ')[0]}! Your enquiry reference is ${data.orderId}. We’ll review your requirements and get back to you.`)
    } catch {
      setFormState('error')
      setFormMessage('Could not reach the server. You can still contact us on WhatsApp.')
    }
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">{config.brand}</a>
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <a href="#services" onClick={()=>setMenuOpen(false)}>Services</a>
            <a href="#packages" onClick={()=>setMenuOpen(false)}>Packages</a>
            <a href="#work" onClick={()=>setMenuOpen(false)}>Work</a>
            <a href="#process" onClick={()=>setMenuOpen(false)}>Process</a>
            <button className="btn btn-primary" onClick={()=>{setMenuOpen(false);openOrder()}}>Get started</button>
          </nav>
          <button className="menu-btn" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow"><span className="eyebrow-line"></span> PERSONAL BRANDING STUDIO</div>
            <h1>Stand out.<br/><span>Get noticed.</span><br/>Get hired.</h1>
            <p className="hero-lead">We craft resumes, portfolio websites and LinkedIn profiles that make your skills easy to see — for students, freshers and professionals.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={()=>openOrder()}>Start your enquiry <ArrowUpRight size={16}/></button>
              <a className="btn btn-ghost" href="#work">See demo work</a>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top"><ShieldCheck size={18}/> Trusted process · Clear scope · WhatsApp support</div>
            <ul className="hero-list">
              <li><Check size={16}/> ATS-friendly resume layouts</li>
              <li><Check size={16}/> Mobile-first portfolio sites</li>
              <li><Check size={16}/> LinkedIn profile clarity</li>
              <li><Check size={16}/> Honest pricing, no fake claims</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow"><span className="eyebrow-line"></span> SERVICES</div>
            <h2>What we help you ship</h2>
            <p>Pick a single service or a package. Prices are starting points — final scope is confirmed after your enquiry.</p>
          </div>
          <div className="service-grid">
            {config.services.map((s, i) => {
              const Icon = icons[i] || FileText
              return (
                <article key={s.title} className="service-card">
                  <div className="service-icon"><Icon size={22}/></div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="service-price">From {money(s.price)}</div>
                  <button className="text-link" onClick={()=>openOrder()}>Enquire <ArrowRight size={14}/></button>
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
            {config.packages.map(p => (
              <article key={p.id} className={`package-card ${p.featured ? 'featured' : ''}`}>
                {p.featured && <div className="badge">Most popular</div>}
                <h3>{p.name}</h3>
                <div className="package-price">{money(p.price)}</div>
                <p>{p.description}</p>
                <ul>{p.features.map(f => <li key={f}><Check size={15}/> {f}</li>)}</ul>
                <button className="btn btn-primary" onClick={()=>openOrder(p.id)}>Choose {p.name}</button>
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
            <p>These are demo examples, not client work. Every card is clearly labeled as demo.</p>
          </div>
          <div className="filters">
            {categories.map(c => (
              <button key={c} className={activeCategory===c ? 'active' : ''} onClick={()=>setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="work-grid">
            {filtered.map(item => (
              <button key={item.name} className={`work-card color-${item.color}`} onClick={()=>setPreview(item)}>
                <div className="work-avatar">{item.initials}</div>
                <div className="work-meta">
                  <span className="work-type">{item.type} · DEMO</span>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </button>
            ))}
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
            {steps.map(([n,t,d]) => (
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
          <h2>Your skills are real.<br/><span>Let’s make them visible.</span></h2>
          <p>Tell us where you’re headed. We’ll help you present the work that gets you there.</p>
          <div className="cta-actions">
            <button className="btn btn-light" onClick={()=>openOrder()}>Tell us what you need <ArrowUpRight size={16}/></button>
            <a className="btn btn-ghost-light" href={whatsappUrl(`Hi ${config.brand}, I want to discuss a project.`)} target="_blank" rel="noreferrer">WhatsApp us</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>{config.brand}</strong>
            <p>Resumes · Portfolios · LinkedIn · Personal branding</p>
          </div>
          <div className="footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href={`mailto:${config.email}`}>{config.email}</a>
          </div>
        </div>
      </footer>

      {preview && (
        <div className="modal-backdrop" onClick={()=>setPreview(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setPreview(null)}><X size={18}/></button>
            <div className={`work-avatar large color-${preview.color}`}>{preview.initials}</div>
            <h3>{preview.name}</h3>
            <p>{preview.role} · <strong>DEMO</strong></p>
            <div className="tags">{preview.tags.map(t=><span key={t}>{t}</span>)}</div>
            <p className="muted">This is an illustrative demo portfolio card, not a real client project.</p>
          </div>
        </div>
      )}

      {orderOpen && (
        <div className="modal-backdrop" onClick={()=>setOrderOpen(false)}>
          <div className="modal order-modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOrderOpen(false)}><X size={18}/></button>
            <h2>Project enquiry</h2>
            <p className="muted">Enquiries are not paid orders. We’ll confirm scope and payment separately.</p>
            {formState==='success' ? (
              <div className="success-box">
                <CheckCircle2 size={28}/>
                <p>{formMessage}</p>
                <a className="btn btn-primary" href={whatsappUrl(`Hi ${config.brand}, my enquiry ref is ${currentOrderId}.`)} target="_blank" rel="noreferrer">Continue on WhatsApp <ArrowUpRight size={16}/></a>
                <button className="text-link" onClick={()=>setOrderOpen(false)}>Close</button>
              </div>
            ) : (
              <form className="order-form" onSubmit={submitOrder} noValidate>
                <div className="form-grid">
                  <label>Full name *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name" autoComplete="name"/></label>
                  <label>Email address *<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="email"/></label>
                  <label>WhatsApp number *<input required value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="+91 98XXXXXXXX" autoComplete="tel"/></label>
                  <label>Service required *<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}>{config.services.map(s=><option key={s.title}>{s.title}</option>)}{config.packages.map(p=><option key={p.id} value={`${p.name} Package`}>{p.name} Package</option>)}</select></label>
                  <label>Approx. budget<select value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}><option>₹799 – ₹2,000</option><option>₹2,000 – ₹5,000</option><option>₹5,000 – ₹10,000</option><option>Flexible / discuss</option></select></label>
                  <label>Preferred deadline<input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} min={new Date().toISOString().slice(0,10)}/></label>
                  <label className="full-field">Additional requirements<textarea value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})} placeholder="Your goals, current resume/portfolio, preferred style, links..." rows={4}/></label>
                </div>
                {formState==='error' && <p className="form-error" role="alert">{formMessage}<br/><a href={whatsappUrl(`Hi ${config.brand}, I need help with ${form.service}. My name is ${form.name||'[name]'}.`)} target="_blank" rel="noreferrer">Contact us on WhatsApp instead ↗</a></p>}
                <div className="form-submit-row">
                  <p>By submitting, you agree to our <a href="/privacy.html" target="_blank">privacy policy</a>.</p>
                  <button className="btn btn-primary" type="submit" disabled={formState==='sending'}>{formState==='sending'?'Sending…':'Submit enquiry'} <ArrowUpRight size={16}/></button>
                </div>
                <small className="form-hint">Enquiries are not paid orders. We’ll confirm scope, delivery and payment steps separately.</small>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default App
