// ================== ROUTE CARDS ANIMATION ==================
(function () {
  const cards = document.querySelectorAll('.routes-grid > .route-card');

  cards.forEach((card, i) => {
    const col = i % 3; // 0:left, 1:middle, 2:right
    const row = Math.floor(i / 3);
    const delay = row * 140 + col * 80;
    card.style.setProperty('--stagger', delay + 'ms');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => io.observe(card));
})();

// ================== STATS COUNTER ==================
(function(){
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  function animateCounter(el, duration = 3000){
    const target = Number(el.dataset.target || 0);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const fmt = new Intl.NumberFormat();
    let start = null;

    function frame(ts){
      if(!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = easeOutCubic(p);
      const val = Math.round(target * eased);
      el.textContent = `${prefix}${fmt.format(val)}${suffix}`;
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const box = document.getElementById('statsBox');
  if (!box) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        box.classList.add('in-view');
        const counters = box.querySelectorAll('.counter');
        counters.forEach((el, i)=> setTimeout(()=> animateCounter(el, 3000), i*200));
        io.unobserve(box);
      }
    });
  }, { threshold: 0.35 });

  io.observe(box);
})();

// ================== STICKY NAVBAR + ACTIVE LINKS ==================
window.addEventListener("scroll", function() {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    if (window.scrollY > 0) navbar.classList.add("is-sticky");
    else navbar.classList.remove("is-sticky");
  }
});

(function(){
  const homeLink  = document.querySelector('.nav-links a[href="#home"]');
  const aboutLink = document.querySelector('.nav-links a[href="#about"]');
  const aboutSec  = document.getElementById("about");

  if(homeLink && aboutLink && aboutSec){
    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      const aboutTop = aboutSec.offsetTop - 120;
      const aboutBottom = aboutTop + aboutSec.offsetHeight;

      homeLink.classList.remove("active");
      aboutLink.classList.remove("active");

      if (scrollY >= aboutTop && scrollY < aboutBottom) {
        aboutLink.classList.add("active");
      } else {
        homeLink.classList.add("active");
      }
    });
  }
})();

// ================== SCROLL TO TOP BUTTON ==================
(function(){
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollTopBtn.style.display = "block";
    } else {
      scrollTopBtn.style.display = "none";
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ================== CUSTOM SELECT DROPDOWNS ==================
(function(){
  const ORANGE_SELECT = ".js-enhance-select";

  function closeAll(){
    document.querySelectorAll(".csel.csel--open").forEach(w=> w.classList.remove("csel--open"));
    document.querySelectorAll(".csel__btn[aria-expanded='true']").forEach(b=> b.setAttribute("aria-expanded","false"));
  }

  document.addEventListener("mousedown", e => {
    // allow clicks inside flatpickr calendar
    if (e.target.closest(".flatpickr-calendar")) return;
    if (!e.target.closest(".csel")) closeAll();
  });

  document.querySelectorAll(ORANGE_SELECT).forEach(native => {
    const wrap = document.createElement("div");
    wrap.className = "csel";
    native.parentNode.insertBefore(wrap, native);
    wrap.appendChild(native);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "csel__btn";
    btn.setAttribute("aria-haspopup","listbox");
    btn.setAttribute("aria-expanded","false");
    wrap.appendChild(btn);

    const list = document.createElement("div");
    list.className = "csel__list";
    list.role = "listbox";
    const listId = 'csel-' + Math.random().toString(36).slice(2);
    list.id = listId;
    btn.setAttribute("aria-controls", listId);
    wrap.appendChild(list);

    const opts = [];
    [...native.options].forEach((o) => {
      const item = document.createElement("div");
      item.className = "csel__opt";
      item.tabIndex = -1;
      item.role = "option";
      item.dataset.value = o.value || o.text;
      item.textContent = o.text;
      if (o.disabled) item.setAttribute("aria-disabled","true");
      if (o.selected) {
        item.setAttribute("aria-selected","true");
        btn.textContent = o.text;
      }
      list.appendChild(item);
      opts.push(item);
    });

    if (!btn.textContent.trim()) {
      const ph = native.querySelector("option[hidden], option[disabled][selected]") || native.options[0];
      btn.textContent = ph ? ph.text : "Select";
    }

    function setActive(el){
      opts.forEach(x=> x.classList.remove("csel__opt--active"));
      if (!el) return;
      el.classList.add("csel__opt--active");
      const r = el.getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      if (r.top < lr.top) list.scrollTop -= (lr.top - r.top) + 6;
      if (r.bottom > lr.bottom) list.scrollTop += (r.bottom - lr.bottom) + 6;
    }

    let activeIndex = -1;

    function open(){
      closeAll();
      wrap.classList.add("csel--open");
      btn.setAttribute("aria-expanded","true");
      const sel = list.querySelector('[aria-selected="true"]') || opts[0];
      activeIndex = opts.indexOf(sel);
      setActive(sel);
      setTimeout(()=> sel?.focus(), 0);
    }

    function close(){
      wrap.classList.remove("csel--open");
      btn.setAttribute("aria-expanded","false");
      btn.focus();
    }

    function selectItem(el){
      if (!el || el.hasAttribute("aria-disabled")) return;
      opts.forEach(x=> x.removeAttribute("aria-selected"));
      el.setAttribute("aria-selected","true");
      btn.textContent = el.textContent;
      native.value = el.dataset.value;
      native.dispatchEvent(new Event("change", {bubbles:true}));
      close();
    }

    btn.addEventListener("click", () => {
      wrap.classList.contains("csel--open") ? close() : open();
    });

    list.addEventListener("click", e => {
      const el = e.target.closest(".csel__opt");
      if (el) selectItem(el);
    });

    btn.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault(); open();
      }
    });

    list.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(opts.length-1, activeIndex+1);
        setActive(opts[activeIndex] || opts[0]);
        opts[activeIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex-1);
        setActive(opts[activeIndex] || opts[0]);
        opts[activeIndex]?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault(); selectItem(opts[activeIndex] || opts[0]);
      }
    });

    native.addEventListener("change", () => {
      const match = opts.find(x => x.dataset.value === native.value);
      if (match) selectItem(match);
    });
  });
})();

// ================== FLATPICKR DATE PICKER ==================
flatpickr(".js-date", {
  dateFormat: "Y-m-d",     // backend friendly
  altInput: true,
  altFormat: "F j, Y",     // user friendly
  allowInput: true,
  disableMobile: true,
  minDate: "today",
});

// prevent Enter key auto-submit inside date field
const dateInput = document.querySelector(".js-date");
if (dateInput) {
  dateInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });
}

// ================== FORM VALIDATION ==================
const formEl = document.querySelector(".form-container");
if (formEl) {
  formEl.addEventListener("submit", (e) => {
    const f = e.target;
    const district = f.elements["district"]?.value?.trim();
    const bus      = f.elements["bus"]?.value?.trim();
    const dateVal  = f.elements["date"]?.value?.trim();

    if (!district || !bus || !dateVal) {
      e.preventDefault();
      if (!district) highlight("[name='district']");
      if (!bus)      highlight("[name='bus']");
      if (!dateVal)  highlight(".js-date");
    }
  });
}

function highlight(sel){
  const el = document.querySelector(sel);
  if(!el) return;
  el.style.boxShadow = "0 0 0 3px rgba(242,101,34,.35)";
  setTimeout(()=> el.style.boxShadow = "", 1500);
}

// ================== MOBILE MENU ==================
(function () {
  const body      = document.body;
  const btnOpen   = document.getElementById('menuBtn');
  const btnClose  = document.getElementById('closeMenu');
  const drawer    = document.getElementById('mobileNav');
  const backdrop  = document.getElementById('backdrop');

  function openMenu(){
    body.classList.add('menu-open');
    drawer?.setAttribute('aria-hidden','false');
    btnOpen?.setAttribute('aria-expanded','true');
    if (backdrop) backdrop.hidden = false;
    setTimeout(()=> drawer?.querySelector('a')?.focus(), 120);
  }

  function closeMenu(){
    body.classList.remove('menu-open');
    drawer?.setAttribute('aria-hidden','true');
    btnOpen?.setAttribute('aria-expanded','false');
    setTimeout(()=> { if(backdrop) backdrop.hidden = true; }, 200);
    btnOpen?.focus();
  }

  btnOpen?.addEventListener('click', openMenu);
  btnClose?.addEventListener('click', closeMenu);
  backdrop?.addEventListener('click', closeMenu);
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu(); });
})();

// ================== BLOCK "#" LINKS DEFAULT ==================
document.addEventListener("click", function(e) {
  const a = e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});
