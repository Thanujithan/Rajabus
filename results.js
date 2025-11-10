// ---- read params from URL
  const params   = new URLSearchParams(location.search);
  const district = (params.get("district")||"").trim();
  const date     = (params.get("date")||"").trim();  // YYYY-MM-DD
  const busType  = (params.get("bus")||"").trim();

  // normalize: accept common spellings for Mihintale
  const MIHINTALE_ALIASES = ["mihintale", "mihinthale", "mihintala"];
  const isMihintale = s => MIHINTALE_ALIASES.includes(String(s).toLowerCase());

  const pill = document.getElementById("criteriaPill");
  pill.textContent = `${district || "—"} • ${date || "—"} • ${busType || "—"}`;

  // ---- load timetable JSON
  fetch("data/buses.json")
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(all => {
      // filter: from Mihintale → selected district, exact date, selected type
      const rows = all.filter(b =>
        isMihintale(b.from) &&
        String(b.to).toLowerCase()   === district.toLowerCase() &&
        String(b.date)               === date &&
        String(b.type).toLowerCase() === busType.toLowerCase()
      );

      const list = document.getElementById("list");
      if (!rows.length) {
        list.innerHTML = `
          <div class="empty">
            No buses found for <b>${escapeHtml(district || "—")}</b> on
            <b>${escapeHtml(date || "—")}</b> (${escapeHtml(busType || "—")}).
          </div>`;
        return;
      }

      // sort by departure time (supports "HH:MM" or "h:mm am/pm")
      rows.sort((a,b)=> toMinutes(a.depart) - toMinutes(b.depart));
      list.innerHTML = rows.map(renderCard).join("");
    })
    .catch(err => {
      document.getElementById("list").innerHTML =
        `<div class="empty">Failed to load <b>data/buses.json</b><br><small>${escapeHtml(err.message)}</small></div>`;
    });

  function renderCard(b){
    const fare = (isFinite(b.fare_min) && isFinite(b.fare_max))
      ? `Rs. ${Number(b.fare_min).toLocaleString()}–${Number(b.fare_max).toLocaleString()}`
      : "—";

    return `
      <article class="card">
        <div class="row">
          <div class="place">${escapeHtml(titleCase(b.from))}</div>
          <div class="arrow">→</div>
          <div class="place" style="justify-self:end">${escapeHtml(titleCase(b.to))}</div>
          <div class="time">Depart : ${escapeHtml(fmtTime(b.depart))}</div>
          <div></div>
          <div class="time right-meta">Arrive : ${escapeHtml(fmtTime(b.arrive))}</div>
        </div>

        <div class="specs">
          <div><span class="label">Distance</span><span class="val">${escapeHtml(b.distance_km)} km</span></div>
          <div><span class="label">Bus type</span><span class="val">${escapeHtml(b.type)}</span></div>
          <div><span class="label">Bus no</span><span class="val">${escapeHtml(b.bus_no)}</span></div>
          <div><span class="label">Fare Range</span><span class="val">${fare}</span></div>
        </div>

        <div class="cta-wrap">
          <button class="btn"
            onclick='alert("Booking for ${escapeJs(b.from)} → ${escapeJs(b.to)} on ${escapeJs(b.date)} (${escapeJs(b.type)})")'>
            Book Now
          </button>
        </div>
      </article>`;
  }

  // --- helpers ---
  function fmtTime(t){
    if (!t) return "";
    const s = String(t).trim();
    if (/[ap]m$/i.test(s)) return s; // already 12h
    // "HH:MM" -> "h:mm am/pm"
    const [H,M] = s.split(":").map(Number);
    if (isNaN(H)) return s;
    const h12 = ((H + 11) % 12) + 1;
    const ap = H >= 12 ? "pm" : "am";
    return `${h12}:${String(M||0).padStart(2,"0")} ${ap}`;
  }
  function toMinutes(t){
    if (!t) return 0;
    const s = String(t).trim().toLowerCase();
    if (/[ap]m$/.test(s)){
      const m = s.match(/^(\d{1,2}):(\d{2})\s*([ap])m$/i);
      if (!m) return 0;
      let hh = parseInt(m[1],10) % 12;
      const mm = parseInt(m[2],10) || 0;
      if (m[3].toLowerCase()==="p") hh += 12;
      return hh*60 + mm;
    }
    const [H,M] = s.split(":").map(x=>parseInt(x,10));
    if (isNaN(H)) return 0;
    return H*60 + (M||0);
  }
  function titleCase(x){ return String(x).replace(/\b\w/g, c => c.toUpperCase()); }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  function escapeJs(s){return String(s).replace(/["'\\]/g, "\\$&")}