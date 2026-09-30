/* Rien (ou presque) — amélioration progressive. Le site fonctionne sans JavaScript. */
(() => {
  const root = document.documentElement;

  /* Thème clair / sombre (sombre par défaut) */
  const btn = document.querySelector('.theme-btn');
  const sync = () => {
    const light = root.dataset.theme === 'light';
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(light));
    btn.querySelector('.sr-only').textContent = light ? 'Thème sombre' : 'Thème clair';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f5f7f3' : '#0e1311';
  };
  sync();
  btn?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* stockage indisponible */ }
    sync();
  });

  /* Navigation mobile : garder l'onglet courant visible */
  const navUl = document.querySelector('.main-nav ul');
  const cur = navUl?.querySelector('[aria-current="page"]');
  if (navUl && cur && navUl.scrollWidth > navUl.clientWidth) {
    navUl.scrollLeft = cur.parentElement.offsetLeft - navUl.clientWidth / 2 + cur.offsetWidth / 2;
  }

  /* Sommaire : section courante */
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const heads = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    let current = null;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) current = e.target.id;
      links.forEach((a) => a.classList.toggle('is-active', a.hash.slice(1) === current));
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }

  /* Widget sigma */
  const w = document.getElementById('sigma-widget');
  if (w) {
    const ctrl = w.querySelector('.sigma-ctrl');
    const range = w.querySelector('#sigma-range');
    const out = w.querySelector('#sigma-out');
    const read = w.querySelector('#sigma-read');
    const rows = [...w.querySelectorAll('tbody tr')];
    const notes = {
      1: 'Un « effet » à 1 σ apparaît par hasard environ une fois sur six : autant dire du bruit.',
      2: 'Seuil proche du fameux p\u00a0&lt;\u00a00,05 (en test bilatéral). Longtemps suffisant pour publier en biologie ou en psychologie — et source de nombreux faux positifs.',
      3: 'En physique des particules, on parle d’«\u00a0indice\u00a0» (evidence) à partir de 3 σ. Beaucoup d’indices à 3 σ ont disparu avec plus de données.',
      4: 'Encore insuffisant pour annoncer une découverte : quand des milliers d’analyses sont menées en parallèle, des fluctuations à 4 σ finissent par apparaître quelque part (l’«\u00a0effet de regard ailleurs\u00a0»).',
      6: 'Une fluctuation pure devient extraordinairement improbable ; les débats portent alors sur la méthode, pas sur le hasard.',
      5: 'Le seuil de «\u00a0découverte\u00a0» en physique des particules, retenu pour le boson de Higgs en 2012.',
      7: 'Au-delà, la question n’est plus le hasard mais les erreurs systématiques — qu’aucun nombre de sigmas ne mesure.',
    };
    ctrl.hidden = false;
    const upd = () => {
      const i = +range.value;
      const r = rows[i];
      const s = r.querySelector('th').textContent.replace(' σ', '').trim();
      const cells = r.querySelectorAll('td');
      out.textContent = s;
      rows.forEach((x, j) => x.classList.toggle('hl', j === i));
      const key = Math.floor(parseFloat(s.replace(',', '.')));
      read.innerHTML = `À ${s}\u00a0σ, le hasard seul produirait un signal aussi fort environ <strong>1\u00a0fois sur ${cells[1].textContent}</strong>. ` + (notes[parseFloat(s.replace(',', '.'))] || notes[key] || '').replace(/ ([:;?!σ])/g, '\u00a0$1');
    };
    range.addEventListener('input', upd);
    upd();
  }
})();
