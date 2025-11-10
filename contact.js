
 


  (function(){
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn    = document.getElementById('submitBtn');

  function setBusy(b){
    if(!btn) return;
    btn.disabled = b;
    btn.style.opacity = b ? '0.7' : '1';
    btn.style.pointerEvents = b ? 'none' : 'auto';
  }

  form?.addEventListener('submit', async function(e){
    e.preventDefault();

    // basic checks
    const name  = form.elements['name']?.value?.trim();
    const email = form.elements['email']?.value?.trim();
    const msg   = form.elements['message']?.value?.trim();
    if(!name || !email || !msg){
      status.textContent = '⚠️ Please fill required fields.';
      return;
    }

    status.textContent = 'Sending...';
    setBusy(true);

    try {
      const res = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        status.textContent = '✅ Message sent successfully! We will get back to you soon.';
      } else {
        const data = await res.json().catch(() => ({}));
        status.textContent = (data.errors && data.errors[0]?.message)
          ? '❌ ' + data.errors[0].message
          : '❌ Something went wrong. Please try again.';
      }
    } catch {
      status.textContent = '❌ Network error. Please try later.';
    } finally {
      setBusy(false);
    }
  });
})();
















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


