/* -------- LocalStorage + Seed -------- */
const STORAGE_KEY = "busReviews_v4_en";
const seed = [
  {name:"Tharindu", place:"Colombo", rating:5, text:"Matara trip was great. Timing was accurate.", ts: Date.now()-36e5*8},
  {name:"Shalini", place:"Jaffna", rating:5, text:"Clean design. Please add Tamil language.", ts: Date.now()-36e5*30},
  {name:"Aakash", place:"Kandy", rating:4, text:"Seat & price are clear. Live tracking would be awesome.", ts: Date.now()-36e5*60},
  {name:"Narmatha", place:"Trincomalee", rating:5, text:"Customer support responds quickly. Recommend!", ts: Date.now()-36e5*120},
  {name:"Sahan", place:"Galle", rating:3, text:"Some delays sometimes. Overall ok.", ts: Date.now()-36e5*200}
];

const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];

const state = { reviews: [], filter:'all', sort:'new' };

function saveReviews(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reviews)); }
function loadReviews(){
  const raw = localStorage.getItem(STORAGE_KEY);
  state.reviews = raw ? JSON.parse(raw) : [...seed];
  if(!raw) saveReviews();
}

/* -------- Render helpers -------- */
function starIcons(n){
  let html=''; for(let i=1;i<=5;i++){
    html += `<svg viewBox="0 0 20 20" class="${i<=n?'on':''}" aria-hidden="true"><path d="M10 .9l2.6 5.3 5.9.9-4.3 4.2 1 5.8L10 14.9 4.8 17l1-5.8L1.5 7.1l5.9-.9L10 .9z"/></svg>`;
  } return html;
}
function formatDate(ts){ const d=new Date(ts); return d.toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'2-digit'}); }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

function computeStats(list){
  const total=list.length, buckets=[0,0,0,0,0]; let sum=0;
  list.forEach(r=>{ sum+=r.rating; buckets[r.rating-1]++; });
  return { total, avg: total? (sum/total):0, buckets };
}
function applySortFilter(){
  let list=[...state.reviews];
  if(state.filter!=='all'){ const want=+state.filter; list=list.filter(r=>r.rating===want); }
  if(state.sort==='new')  list.sort((a,b)=>b.ts-a.ts);
  if(state.sort==='high') list.sort((a,b)=>b.rating-a.rating || b.ts-a.ts);
  if(state.sort==='low')  list.sort((a,b)=>a.rating-b.rating || b.ts-a.ts);
  return list;
}

function renderDistribution(){
  const {buckets,total,avg}=computeStats(state.reviews);
  $("#bigScore").textContent = avg.toFixed(1);
  $("#bigStars").innerHTML = starIcons(Math.round(avg));
  $("#avgStars").innerHTML = starIcons(Math.round(avg));
  $("#avgScore").textContent = avg.toFixed(1);
  $("#totalCount").textContent = total;

  const dist = $("#distBars"); dist.innerHTML='';
  for(let s=5;s>=1;s--){
    const count=buckets[s-1]; const pct = total ? Math.round(count*100/total) : 0;
    dist.insertAdjacentHTML('beforeend', `
      <div class="bar-row">
        <span>${s}★</span>
        <div class="bar" aria-label="${s} star bar"><span style="width:${pct}%"></span></div>
        <span>${pct}%</span>
      </div>
    `);
  }
}

function renderList(){
  const list = applySortFilter();
  const root = $("#reviewsList"); root.innerHTML='';
  if(!list.length){ $("#empty").style.display='block'; return; }
  $("#empty").style.display='none';
  list.slice().forEach(r=>{
    const name=(r.name||"").trim()||"Anonymous";
    const loc =(r.place||"").trim()?` · ${escapeHtml(r.place)}`:'';
    root.insertAdjacentHTML('beforeend', `
      <article class="review">
        <div class="meta">
          <div class="name">${escapeHtml(name)}<span class="badge">${formatDate(r.ts)}</span></div>
          <div class="stars">${starIcons(r.rating)}</div>
        </div>
        <div class="muted">${r.rating}★${loc}</div>
        <p class="body">${escapeHtml(r.text)}</p>
      </article>
    `);
  });
}

/* -------- Stars UI (Left→Right, JS fill) -------- */
function bindStarEvents(){
  const rateBox = $("#rateBox");
  const rateLive = $("#rateLive");
  const radios = [...rateBox.querySelectorAll('input[name="rating"]')];
  const labels = [...rateBox.querySelectorAll('label')];

  function setFill(v){
    labels.forEach((lb,i)=> lb.classList.toggle('active', i < v));
    rateLive.textContent = v ? `${v} ★ selected` : 'Select rating';
  }
  labels.forEach((lb,i)=>{
    lb.addEventListener('mouseenter', ()=> setFill(i+1));
    lb.addEventListener('click', ()=>{ radios[i].checked = true; setFill(i+1); });
  });
  rateBox.addEventListener('mouseleave', ()=>{
    const v = parseInt(rateBox.querySelector('input:checked')?.value || 0, 10);
    setFill(v);
  });
  radios.forEach((r,i)=> r.addEventListener('change', ()=> setFill(i+1)));
  setFill(parseInt(rateBox.querySelector('input:checked')?.value || 0, 10));
}

/* -------- Form & Controls -------- */
function bindForm(){
  const form = $("#reviewForm");
  const cc   = $("#cc");
  form.text.addEventListener('input', ()=>{ cc.textContent = form.text.value.length; });

  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const fd=new FormData(form);
    const rating=+fd.get('rating');
    const text=(fd.get('text')||'').trim();
    if(!rating || text.length<4){
      $("#formNote").textContent="Rating & at least 4 characters are required.";
      return;
    }
    state.reviews.push({
      name:(fd.get('name')||'').trim(),
      place:(fd.get('place')||'').trim(),
      rating, text, ts:Date.now()
    });
    saveReviews();
    form.reset(); $("#rateLive").textContent='Select rating'; cc.textContent='0';
    renderDistribution(); renderList();
    $("#formNote").textContent="Thanks! Your review was added.";
    setTimeout(()=>$("#formNote").textContent="* Required fields", 2500);
  });
}
function bindControls(){
  $("#sortSel").addEventListener('change', (e)=>{ state.sort=e.target.value; renderList(); });
  $$(".chip-btn").forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$(".chip-btn").forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderList();
    });
  });
}

/* -------- Init -------- */
document.addEventListener('DOMContentLoaded', ()=>{
  loadReviews(); renderDistribution(); renderList();
  bindStarEvents(); bindForm(); bindControls();
});


  window.addEventListener("scroll", function() {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 0) {
      navbar.classList.add("is-sticky");
    } else {
      navbar.classList.remove("is-sticky");
    }
  });
// Button reference
const scrollTopBtn = document.getElementById("scrollTopBtn");

// Show button after scrolling 200px
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }
});

// Scroll to top on click
scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"   // smooth animation
  });
});















  (function () {
    const body      = document.body;
    const btnOpen   = document.getElementById('menuBtn');
    const btnClose  = document.getElementById('closeMenu');
    const drawer    = document.getElementById('mobileNav');
    const backdrop  = document.getElementById('backdrop');

    function openMenu(){
      body.classList.add('menu-open');
      drawer.setAttribute('aria-hidden','false');
      btnOpen.setAttribute('aria-expanded','true');
      backdrop.hidden = false;
      // focus for a11y
      setTimeout(()=> drawer.querySelector('a')?.focus(), 120);
    }

    function closeMenu(){
      body.classList.remove('menu-open');
      drawer.setAttribute('aria-hidden','true');
      btnOpen.setAttribute('aria-expanded','false');
      // wait for fade-out then hide backdrop
      setTimeout(()=> { backdrop.hidden = true; }, 200);
      btnOpen.focus();
    }

    btnOpen?.addEventListener('click', openMenu);
    btnClose?.addEventListener('click', closeMenu);
    backdrop?.addEventListener('click', closeMenu);

    // ESC to close
    window.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu();
    });
  })();


