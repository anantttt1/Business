const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,hv=matchMedia('(hover:hover)').matches;
/* Portfolio Builder button: same green as WhatsApp + soft self-glow (no hover needed) */
(function(){
  const s=document.createElement('style');
  s.textContent='.sg .card .btn.p{background:var(--wa)!important;background-image:none!important;color:#05210f!important;box-shadow:0 12px 34px -12px var(--wa),0 0 0 0 rgba(37,211,102,.35);animation:apPGlow 2.4s ease-in-out infinite}.sg .card .btn.p:hover{transform:translateY(-2px);box-shadow:0 14px 36px -10px var(--wa),0 0 0 6px rgba(37,211,102,.15)}@keyframes apPGlow{0%,100%{box-shadow:0 12px 34px -12px var(--wa),0 0 0 0 rgba(37,211,102,.4)}50%{box-shadow:0 12px 34px -12px var(--wa),0 0 0 10px rgba(37,211,102,.1)}}@media (prefers-reduced-motion:reduce){.sg .card .btn.p{animation:none!important}}';
  document.head.appendChild(s);
})();

/* Highlight Portfolio Builder as main service; group rest under Other Services */
(function(){
  const sec=document.getElementById('services');
  if(!sec) return;
  const grid=sec.querySelector('.sg');
  const builder=sec.querySelector('[data-builder]');
  if(!grid||!builder) return;
  if(sec.querySelector('.svc-feature')) return;

  const style=document.createElement('style');
  style.textContent=`
  .svc-feature{display:grid;grid-template-columns:1.05fr 1fr;gap:22px;align-items:center;padding:22px;margin:0 0 28px;border-radius:18px;position:relative;overflow:hidden;border:1px solid rgba(168,85,247,.35);box-shadow:0 24px 50px -28px rgba(168,85,247,.55);background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02))}
  .svc-feature::before{content:"";position:absolute;inset:-40% -15% auto auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,.3),transparent 70%);pointer-events:none}
  .svc-feature-media{border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#141218;aspect-ratio:16/10;min-height:160px}
  .svc-feature-media img{display:block;width:100%;height:100%;object-fit:cover}
  .svc-feature-body{position:relative;z-index:1}
  .svc-feature-badge{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 10px;border-radius:99px;color:#f5e9ff;background:rgba(168,85,247,.22);border:1px solid rgba(168,85,247,.45);margin-bottom:10px}
  .svc-feature-body h3{font-size:clamp(1.4rem,3vw,1.85rem);margin:0 0 10px}
  .svc-feature-body p{color:var(--mu,#B6B0BB);font-size:.98rem;margin:0 0 14px;line-height:1.55}
  .svc-feature-points{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:8px}
  .svc-feature-points li{font-size:.9rem;padding-left:18px;position:relative}
  .svc-feature-points li::before{content:"";position:absolute;left:0;top:.55em;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#FF6B35,#E879F9)}
  .svc-feature-cta{min-height:46px;padding-inline:22px}
  .svc-other-hd{margin:4px 0 16px}
  .svc-other-hd h3{font-size:1.25rem;margin:0 0 4px}
  .svc-other-hd p{color:var(--mu,#B6B0BB);font-size:.92rem;margin:0}
  @media(max-width:880px){.svc-feature{grid-template-columns:1fr;padding:16px;gap:14px}.svc-feature-media{order:-1}}
  `;
  document.head.appendChild(style);

  const img=builder.querySelector('img');
  const feature=document.createElement('article');
  feature.className='svc-feature glass v';
  feature.setAttribute('data-builder','');
  feature.innerHTML=`
    <div class="svc-feature-media">${img?img.outerHTML:''}</div>
    <div class="svc-feature-body">
      <span class="svc-feature-badge">Main service</span>
      <h3>Portfolio Builder</h3>
      <p>Build a professional personal portfolio website in minutes. Pick a template, fill your details, preview live, and download a ready-to-deploy ZIP — ideal for students and freshers.</p>
      <ul class="svc-feature-points">
        <li>Multiple modern templates</li>
        <li>Live preview & ZIP download</li>
        <li>Student & fresher focused</li>
      </ul>
      <a class="btn p svc-feature-cta" href="/portfolio-builder/">Open Portfolio Builder</a>
    </div>`;

  const otherHd=document.createElement('div');
  otherHd.className='svc-other-hd';
  otherHd.innerHTML='<h3>Our Other Services</h3><p>Resumes, posters, and websites — same quality, clear process.</p>';

  builder.remove();
  grid.parentNode.insertBefore(feature, grid);
  grid.parentNode.insertBefore(otherHd, grid);
  grid.classList.add('sg-other');

  const hd=sec.querySelector('.hd p');
  if(hd) hd.textContent='Our main focus is the Portfolio Builder — plus resume design, posters, and business sites when you need them.';
})();
