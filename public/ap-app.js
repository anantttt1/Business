const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,hv=matchMedia('(hover:hover)').matches;
/* Portfolio Builder button: same green as WhatsApp + soft self-glow (no hover needed) */
(function(){
  const s=document.createElement('style');
  s.textContent='.sg .card .btn.p{background:var(--wa)!important;background-image:none!important;color:#05210f!important;box-shadow:0 12px 34px -12px var(--wa),0 0 0 0 rgba(37,211,102,.35);animation:apPGlow 2.4s ease-in-out infinite}.sg .card .btn.p:hover{box-shadow:0 14px 36px -10px var(--wa),0 0 0 6px rgba(37,211,102,.15)}@keyframes apPGlow{0%,100%{box-shadow:0 12px 34px -12px var(--wa),0 0 0 0 rgba(37,211,102,.4)}50%{box-shadow:0 12px 34px -12px var(--wa),0 0 0 10px rgba(37,211,102,.1)}}@media (prefers-reduced-motion:reduce){.sg .card .btn.p{animation:none}}';
  document.head.appendChild(s);
})();
const WA='https://wa.me/919286034026?text=';
const msg=s=>WA+encodeURIComponent(s?`Hi AP Creative Studio! I'm interested in your ${s} service. Please share the available packages, pricing, timeline, and next steps.`:`Hi AP Creative Studio! I'd like to discuss a custom requirement. Please share the next steps.`);
const P={zap:'M13 2L4 14h7l-1 8 9-12h-7z',check:'M6 3h9l4 4v14H6zM9 14l2 2 4-4',pen:'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',chat:'M4 5h16v11H9l-5 4z',file:'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',refresh:'M20 11a8 8 0 1 0-2 5.5M20 4v7h-7',globe:'M3 5h18v14H3zM3 9h18',cap:'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',image:'M5 3h14v18H5zM8 16l3-3 3 3 2-2 2 2M9 8h.01',mega:'M3 11v3l12 5V6zM15 9a3 3 0 0 1 0 6',store:'M3 8h18v12H3zM8 8V5h8v3',target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',pointer:'M5 3l14 7-6 2-2 6z'};
const WAI='<svg class="wi2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-wa"/></svg>';
const ic=d=>`<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg></span>`;
$$('[data-i]').forEach(e=>{const d=P[e.dataset.i];if(d)e.insertAdjacentHTML('afterbegin',ic(d))});
$$('.ph img').forEach(i=>{const bad=()=>i.remove();if(i.complete&&!i.naturalWidth)bad();else i.addEventListener('error',bad,{once:true})});
/* Service cards: WhatsApp CTA */
$$('#services .card').forEach(c=>{
  const h=c.querySelector('h4');if(!h)return;
  const name=h.textContent.trim();
  if(c.hasAttribute('data-tools')){
    const a=document.createElement('a');
    a.className='btn p';a.href='https://apcreativetools.vercel.app/';a.target='_blank';a.rel='noopener noreferrer';
    a.setAttribute('aria-label','Open Tools (opens in a new tab)');a.textContent='Open Tools';
    c.appendChild(a);return;
  }
  if(c.hasAttribute('data-builder')){
    const a=document.createElement('a');
    a.className='btn p';a.href='/portfolio-builder/';a.textContent='Open Portfolio Builder';
    c.appendChild(a);return;
  }
  const a=document.createElement('a');
  a.className='btn o';a.href=msg(name);a.target='_blank';a.rel='noopener noreferrer';
  a.innerHTML=WAI+'Enquire on WhatsApp';
  c.appendChild(a);
});
// Terms & Conditions: "View more" / "View less" toggle for the extra terms (#tx)
const vm=$('#vm'),tx=$('#tx');
if(vm&&tx)vm.addEventListener('click',()=>{
  const open=tx.hidden;
  tx.hidden=!open;
  vm.setAttribute('aria-expanded',String(open));
  const svg=vm.querySelector('svg');
  vm.textContent=open?'View less ':'View more ';
  if(svg)vm.appendChild(svg);
});
const mb=$('#mb'),nv=$('#nv');
const tg=o=>{if(!nv||!mb)return;nv.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');mb.setAttribute('aria-label',o?'Close menu':'Open menu')};
if(mb)mb.onclick=()=>tg(!nv.classList.contains('open'));
if(nv)nv.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>tg(false)));
addEventListener('keydown',e=>{if(e.key==='Escape'&&nv&&nv.classList.contains('open')){tg(false);mb&&mb.focus()}});
const yr=$('#yr');if(yr)yr.textContent=new Date().getFullYear();
$$('.g.steps,.g.why,.tg').forEach(g=>[...g.children].forEach((c,i)=>{c.classList.add('rv');c.style.setProperty('--d',i*.08+'s')}));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.rv').forEach(e=>rm?e.classList.add('in'):io.observe(e));
let t=0;const sc=()=>{t=0;const y=scrollY;const hd=$('#hd');if(hd)hd.classList.toggle('s',y>20)};
addEventListener('scroll',()=>{if(!t)t=requestAnimationFrame(sc)},{passive:true});sc();
if(!rm&&hv){
 $$('.card').forEach(c=>{
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--ry',(x-.5)*8+'deg');c.style.setProperty('--rx',(.5-y)*8+'deg')});
  c.addEventListener('pointerleave',()=>{c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')});
 });
}
(function(){
 const sp=$('#splash');if(!sp)return;
 document.body.classList.add('splash-on');
 let done=false;
 const hide=()=>{if(done)return;done=true;removeEventListener('keydown',key);sp.classList.add('out');document.body.classList.remove('splash-on');setTimeout(()=>sp.remove(),750)};
 const btn=$('#spEnter');
 if(btn)btn.addEventListener('click',e=>{e.stopPropagation();hide()});
 sp.addEventListener('click',hide);
 const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hide()}};
 addEventListener('keydown',key);
 setTimeout(hide,rm?400:2200);
})();
/* Mentor card: Abhinav Pachauri — below founders */
(function(){
  const grid=document.querySelector('#team .tg');
  if(!grid||grid.querySelector('[data-member="abhinav"]')) return;
  const art=document.createElement('article');
  art.className='tm glass';
  art.setAttribute('data-member','abhinav');
  art.innerHTML='<div class="ph ph-circle"><img src="/team/abhinav-pachauri.jpg" alt="Abhinav Pachauri" width="280" height="280" loading="lazy"></div><h3>Abhinav Pachauri</h3><div class="role">Mentor & Communication Trainer</div><p>Guides the team on communication, presentation skills, and mentoring for clear client interactions.</p>';
  grid.appendChild(art);
})();
/* Nav: Join Our WhatsApp Community */
(function(){
  const ul=document.querySelector('#nv ul');
  if(!ul||ul.querySelector('[data-nav="wa-community"]')) return;
  const li=document.createElement('li');
  li.setAttribute('data-nav','wa-community');
  const a=document.createElement('a');
  a.href='https://chat.whatsapp.com/JUftY40Z16D6E7mEQKGftu';
  a.target='_blank';
  a.rel='noopener noreferrer';
  a.textContent='Join Our WhatsApp Community';
  li.appendChild(a);
  const getStarted=ul.querySelector('a.btn.p');
  if(getStarted&&getStarted.parentElement){
    ul.insertBefore(li,getStarted.parentElement);
  }else{
    ul.appendChild(li);
  }
})();
