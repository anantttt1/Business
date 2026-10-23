const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,hv=matchMedia('(hover:hover)').matches;
const WA='https://wa.me/919286034026?text=';
const msg=s=>WA+encodeURIComponent(s?`Hi AP Creative Studio! I'm interested in your ${s} service. Please share the available packages, pricing, timeline, and next steps.`:`Hi AP Creative Studio! I'd like to discuss a custom requirement. Please share the next steps.`);
const P={zap:'M13 2L4 14h7l-1 8 9-12h-7z',check:'M6 3h9l4 4v14H6zM9 14l2 2 4-4',pen:'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',chat:'M4 5h16v11H9l-5 4z',file:'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',refresh:'M20 11a8 8 0 1 0-2 5.5M20 4v7h-7',globe:'M3 5h18v14H3zM3 9h18',cap:'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',image:'M5 3h14v18H5zM8 16l3-3 3 3 2-2 2 2M9 8h.01',mega:'M3 11v3l12 5V6zM15 9a3 3 0 0 1 0 6',store:'M3 8h18v12H3zM8 8V5h8v3',target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',pointer:'M5 3l14 7-6 2-2 6z'};
const WAI='<svg class="wi2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-wa"/></svg>';
const ic=d=>`<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg></span>`;
$$('[data-i]').forEach(e=>e.insertAdjacentHTML('afterbegin',ic(P[e.dataset.i])));
$$('.sg .card').forEach(e=>{const a=document.createElement('a');a.className='btn wb';a.innerHTML=WAI+'Chat on WhatsApp';a.href=msg(e.querySelector('h4').textContent);a.target='_blank';a.rel='noopener noreferrer';e.appendChild(a)});
const vm=$('#vm'),tx=$('#tx');if(vm&&tx)vm.onclick=()=>{const o=tx.hidden;tx.hidden=!o;vm.setAttribute('aria-expanded',o);vm.querySelector('b').textContent=o?'View Less':'View More'};
const mb=$('#mb'),nv=$('#nv'),tg=o=>{if(!nv||!mb)return;nv.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Close menu':'Open menu')};
if(mb)mb.onclick=()=>tg(!nv.classList.contains('open'));
if(nv)nv.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>tg(false)));
addEventListener('keydown',e=>{if(e.key==='Escape'&&nv&&nv.classList.contains('open')){tg(false);mb&&mb.focus()}});
const yr=$('#yr');if(yr)yr.textContent=new Date().getFullYear();
$$('.g.steps,.g.why,.tg').forEach(g=>[...g.children].forEach((c,i)=>{c.classList.add('rv');c.style.setProperty('--d',i*.08+'s')}));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.rv').forEach(e=>rm?e.classList.add('in'):io.observe(e));
let t=0;const sc=()=>{t=0;const y=scrollY,k=innerWidth<700?.5:1;const hd=$('#hd');if(hd)hd.classList.toggle('s',y>20);if(!rm&&y<innerHeight*1.5)$$('[data-sp]').forEach(e=>e.style.translate=`0 ${y*e.dataset.sp*k}px`)};
addEventListener('scroll',()=>{if(!t)t=requestAnimationFrame(sc)},{passive:true});sc();
if(!rm&&hv){
 const h=$('.hero'),ls=$$('.l');
 if(h)h.addEventListener('pointermove',e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;ls.forEach(l=>l.style.translate=`${x*l.dataset.d}px ${y*l.dataset.d}px`)});
 $$('.card').forEach(c=>{
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--ry',(x-.5)*8+'deg');c.style.setProperty('--rx',(.5-y)*8+'deg');c.style.setProperty('--px',x*100+'%');c.style.setProperty('--py',y*100+'%')});
  c.addEventListener('pointerleave',()=>{c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')});
 });
}
(function(){
 const sp=$('#splash');if(!sp)return;
 document.body.classList.add('splash-on');
 let done=false;
 const hide=()=>{if(done)return;done=true;sp.classList.add('out');document.body.classList.remove('splash-on');setTimeout(()=>sp.remove(),750)};
 const btn=$('#spEnter');
 if(btn)btn.addEventListener('click',e=>{e.stopPropagation();hide()});
 sp.addEventListener('click',hide);
 addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hide()}});
 setTimeout(hide,rm?400:2200);
})();
