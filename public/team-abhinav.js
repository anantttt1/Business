(function(){
  var grid=document.querySelector('#team .tg');
  if(!grid||grid.querySelector('[data-member="abhinav"]')) return;
  var art=document.createElement('article');
  art.className='tm glass';
  art.setAttribute('data-member','abhinav');
  art.innerHTML='<div class="ph ph-circle"><img src="/team/abhinav-pachauri.jpg" alt="Abhinav Pachauri" width="280" height="280" loading="lazy"></div><h3>Abhinav Pachauri</h3><div class="role">Mentor & Communication Trainer</div><p>Guides the team on communication, presentation skills, and mentoring for clear client interactions.</p>';
  grid.appendChild(art);
})();
