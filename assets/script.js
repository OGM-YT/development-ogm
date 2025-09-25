/* === KONFIGURATION === */
const DISCORD_USER_ID = '108262633711040052'; // Deine User-ID
const EMAIL_ADDRESS   = 'ogmyt.busines@gmail.com';
const EMAIL_SUBJECT   = 'Projektanfrage OGM';

/* === Hintergrund Animation === */
(function(){
  const c=document.getElementById('bg'); if(!c) return;
  const ctx=c.getContext('2d');
  const DPR=Math.max(1,window.devicePixelRatio||1);
  let W,H,dots=[];
  function resize(){
    W=c.width=innerWidth*DPR; H=c.height=innerHeight*DPR;
    c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px';
    dots=Array.from({length:60},()=>({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*0.15*DPR, vy:(Math.random()-.5)*0.15*DPR,
      r:Math.random()*2*DPR+0.8*DPR, a:Math.random()*0.6+0.25
    }));
  }
  function step(){
    ctx.clearRect(0,0,W,H);
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>W) d.vx*=-1;
      if(d.y<0||d.y>H) d.vy*=-1;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(110,241,255,${d.a})`; ctx.fill();
    });
    requestAnimationFrame(step);
  }
  addEventListener('resize',resize); resize(); step();
})();

/* === Jahr im Footer === */
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

/* === Back-to-top Button === */
const toTop = document.getElementById('toTop');
if(toTop){
  window.addEventListener('scroll', () => {
    if(window.scrollY > 240) toTop.classList.add('show');
    else toTop.classList.remove('show');
  });
  toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
}

/* === Discord DM öffnen: App + Fallback Web === */
(function setupDiscordLinks(){
  const appLink = `discord://-/users/${DISCORD_USER_ID}`;
  const webLink = `https://discord.com/users/${DISCORD_USER_ID}`;

  const btnApp = document.getElementById('openDiscord');
  const btnWeb = document.getElementById('openDiscordWeb');

  if(btnWeb) btnWeb.href = webLink;

  if(btnApp){
    btnApp.addEventListener('click', (e) => {
      e.preventDefault();
      const appWin = window.open(appLink, '_blank', 'noopener');
      setTimeout(() => {
        if (!document.hidden) window.open(webLink, '_blank', 'noopener');
      }, 1200);
    });
  }
})();

/* === Server-Grid === */
const grid = document.getElementById('grid');
if(grid){
  const tpl = document.getElementById('card-tpl');
  const search = document.getElementById('search');
  const tagbar = document.getElementById('tagbar');
  const clearBtn = document.getElementById('clearFilters');

  let ALL_SERVERS = [], activeTags = new Set();

  async function loadServers(){
    try{
      const res = await fetch('data/servers.json');
      if(!res.ok) throw new Error('servers.json nicht gefunden');
      ALL_SERVERS = await res.json();
      renderTags(); renderGrid();
    }catch(e){
      console.error(e);
      grid.innerHTML = `<p class="desc">Fehler beim Laden der Serverdaten. Prüfe <code>/data/servers.json</code>.</p>`;
    }
  }

  function uniqueTags(){
    const set = new Set();
    ALL_SERVERS.forEach(s => (s.tags||[]).forEach(t => set.add(t)));
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'de'));
  }

  function renderTags(){
    tagbar.innerHTML = '';
    uniqueTags().forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag' + (activeTags.has(tag)?' active':'');
      btn.textContent = tag;
      btn.type = 'button';
      btn.onclick = () => { 
        if(activeTags.has(tag)) activeTags.delete(tag); 
        else activeTags.add(tag); 
        renderTags(); renderGrid(); 
      };
      tagbar.appendChild(btn);
    });
  }

  function filtered(){
    const q = (search.value || '').trim().toLowerCase();
    return ALL_SERVERS.filter(s => {
      const hay = [s.name, s.description, (s.tags||[]).join(' ')].join(' ').toLowerCase();
      const matchesText = !q || hay.includes(q);
      const matchesTags = activeTags.size===0 || (s.tags||[]).some(t => activeTags.has(t));
      return matchesText && matchesTags;
    });
  }

  function renderGrid(){
    grid.innerHTML = '';
    const list = filtered();
    if(list.length === 0){
      grid.innerHTML = '<p class="desc">Keine Server gefunden. Suchbegriff/Filter anpassen.</p>';
      return;
    }
    list.forEach(s => {
      const node = tpl.content.cloneNode(true);
      node.querySelector('.icon').src = s.icon || 'assets/logo.png';
      node.querySelector('.name').textContent = s.name;
      node.querySelector('.status').textContent = s.status || 'aktiv';
      node.querySelector('.members').textContent = s.members ? `${s.members.toLocaleString('de-DE')} Mitglieder` : '';
      node.querySelector('.desc').textContent = s.description || '';
      const tagsWrap = node.querySelector('.tags');
      (s.tags||[]).forEach(t => {
        const b = document.createElement('span');
        b.className = 'badge'; b.textContent = t;
        b.onclick = () => { 
          if(activeTags.has(t)) activeTags.delete(t); 
          else activeTags.add(t); 
          renderTags(); renderGrid(); 
        };
        tagsWrap.appendChild(b);
      });
      node.querySelector('.open').href = s.invite;
      node.querySelector('.copy').addEventListener('click', async () => {
        try{ await navigator.clipboard.writeText(s.invite); }catch{}
      });
      grid.appendChild(node);
    });
  }

  search.addEventListener('input', renderGrid);
  clearBtn.addEventListener('click', () => { 
    search.value = ''; activeTags.clear(); renderTags(); renderGrid(); 
  });

  loadServers();
}
