/* ══════════════════════════════════════════════════════════════
   Portfolio v4 — démo des animations
   Chargé à la fin des pages v4 (accueil, détail, 404), après le
   script de la page. Il n'invente aucun contenu : il anime le DOM rendu
   par la page à partir de projets-data.js.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
  const isDetail = !!document.querySelector('.detail-page');
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lang = () => (root.lang === 'en' ? 'en' : 'fr');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bi = (fr, en) => `data-fr="${esc(fr)}" data-en="${esc(en || fr)}"`;
  const txt = (fr, en) => esc(lang() === 'en' ? (en || fr) : fr);

  root.classList.add('v4');
  if (!reduce) root.classList.add('v4-anim');

  /* ── Boucle de défilement unique ───────────────────────────────
     Chaque effet lié au défilement s'inscrit ici ; un seul rAF par frame. */
  const onScroll = [];
  let ticking = false;
  function tick() { ticking = false; onScroll.forEach(fn => fn()); }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(tick));

  /* ── Apparition à l'écran ─────────────────────────────────────
     La classe v4-in est retirée une fois l'animation finie, pour rendre
     la main aux transitions d'origine (survol des cartes, etc.). */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      el.classList.add('v4-vu');
      if (el.v4OnView) el.v4OnView();
      if (el.classList.contains('v4-in')) {
        const fin = () => { el.classList.remove('v4-in', 'v4-vu', 'v4-blur'); el.style.transitionDelay = ''; };
        el.addEventListener('transitionend', function h(ev) { if (ev.target === el && ev.propertyName === 'opacity') { el.removeEventListener('transitionend', h); fin(); } });
        setTimeout(fin, 2600);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function reveal(el, delay = 0, cb) {
    if (!el) return;
    if (cb) el.v4OnView = cb;
    if (reduce || !io) { el.classList.add('v4-vu'); if (cb) cb(); return; }
    el.classList.add('v4-in');
    if (delay) el.style.transitionDelay = delay + 's';
    io.observe(el);
  }
  function onView(el, cb) {
    if (!el) return;
    if (reduce || !io) { cb(); return; }
    el.v4OnView = cb;
    io.observe(el);
  }

  /* ── Barre de progression ─────────────────────────────────────── */
  const progress = document.createElement('div');
  progress.className = 'v4-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  onScroll.push(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
  });

  /* ── Curseur ──────────────────────────────────────────────────
     Un point qui suit la souris, un anneau qui le rejoint avec retard et
     change selon ce qu'il survole. Souris uniquement. */
  if (fine && !reduce) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'v4-dot'; ring.className = 'v4-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    dot.innerHTML = '<span class="material-icons-round"></span>';
    document.body.append(ring, dot);
    root.classList.add('v4-cursor');
    const icone = dot.firstChild;
    // Une icône par type d'action (Material Icons Round, déjà chargée par les pages).
    const ICONE = { card: 'arrow_outward', zoom: 'zoom_in', drag: 'swap_horiz' };
    const ETATS = [
      ['text', 'input, textarea, select'],
      ['drag', '.v4-strip'],
      ['zoom', '.gallery img, #detail-banner-img, .shot-anim'],
      ['card', '.v2-project-card, .v4-pile-card'],
      ['btn', '.form-submit, .v2-cv-btn'],
      ['link', 'a, button, summary, label, [role="button"]'],
    ];
    let mx = -100, my = -100, rx = -100, ry = -100, magnet = null, running = false;
    function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.2) requestAnimationFrame(loop); else running = false;
    }
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      dot.style.opacity = ring.style.opacity = 1;
      root.classList.remove('v4-cursor-out');
      if (!running) { running = true; requestAnimationFrame(loop); }
      let etat = '', cible = null;
      for (const [nom, sel] of ETATS) { cible = e.target.closest && e.target.closest(sel); if (cible) { etat = nom; break; } }
      ring.dataset.s = etat; dot.dataset.s = etat;
      if (ICONE[etat]) icone.textContent = ICONE[etat];
      // Bouton magnétique : il se laisse attirer par le curseur.
      if (etat === 'btn') {
        const b = cible.getBoundingClientRect();
        cible.style.translate = `${(mx - b.left - b.width / 2) * 0.25}px ${(my - b.top - b.height / 2) * 0.35}px`;
        cible.style.transition = 'translate 0.4s ' + EASE + ', filter 0.2s, background 0.2s, color 0.2s';
        if (magnet && magnet !== cible) magnet.style.translate = '';
        magnet = cible;
      } else if (magnet) { magnet.style.translate = ''; magnet = null; }
    }, { passive: true });
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) root.classList.add('v4-cursor-out'); });
    initLumiere();

    // Sur les cartes, le bord et la surface s'éclairent sous le pointeur.
    const SPOT = '.v2-project-card, .v4-pile-card, .v2-hero-card, .v2-autre-card';
    addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest(SPOT);
      if (!c) return;
      c.classList.add('v4-spot');
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
    addEventListener('pointerdown', () => ring.animate([{ scale: 1 }, { scale: 0.82 }, { scale: 1 }], { duration: 350, easing: EASE }));
  }

  /* ── Lumière qui suit le curseur et laisse une traînée ─────────
     Chaque mouvement dépose des halos le long du trajet ; leur taille et
     leur intensité suivent la vitesse du geste. À chaque image, le canevas
     s'efface un peu : la traînée s'estompe derrière le curseur. La boucle
     s'arrête dès que tout s'est effacé. */
  // Le canevas n'est créé qu'au premier mouvement de souris : rien n'est
  // alloué tant que personne ne bouge (et jamais sur écran tactile).
  function initLumiere() {
    addEventListener('pointermove', function premier(e) {
      if (e.pointerType !== 'mouse') return;
      removeEventListener('pointermove', premier);
      creerLumiere(e);
    }, { passive: true });
  }

  function creerLumiere(e0) {
    const cv = document.createElement('canvas');
    cv.className = 'v4-lueur';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let dpr = 1, W = 0, H = 0;
    function taille() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    taille(); addEventListener('resize', taille);

    // Halo pré-dessiné une fois, refait au changement de thème.
    const sprite = document.createElement('canvas');
    const S = 128;
    sprite.width = sprite.height = S;
    let force = 1;
    function peindreSprite() {
      const g = sprite.getContext('2d');
      const clair = root.getAttribute('data-theme') === 'light';
      const accent = clair ? '#B48CFF' : (getComputedStyle(root).getPropertyValue('--v2-accent').trim() || '#A370FF');
      force = clair ? 0.95 : 1;
      g.clearRect(0, 0, S, S);
      const d = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      d.addColorStop(0, accent);
      d.addColorStop(0.3, accent + '99');
      d.addColorStop(1, accent + '00');
      g.fillStyle = d;
      g.fillRect(0, 0, S, S);
    }
    peindreSprite();
    new MutationObserver(peindreSprite).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    /* La traînée n'est pas accumulée sur la toile : on garde les derniers
       points du trajet et on redessine tout à chaque image, à partir d'une
       toile vide. Chaque point s'affine et pâlit avec l'âge, la trace se
       résorbe donc vers le curseur sans laisser de résidu. */
    const VIE = 700;                 // durée de vie d'un point de la trace (ms)
    const points = [];
    let hx = e0.clientX, hy = e0.clientY;   // halo de tête, légèrement en retard
    let tx = hx, ty = hy, eclat = 0, vitesse = 0, dernier = e0.clientX, dernierY = e0.clientY;
    let tPrec = performance.now(), actif = false;

    function ajouter(x, y, t) {
      const dx = x - dernier, dy = y - dernierY, dist = Math.hypot(dx, dy);
      // Un point tous les 6 px : la trace reste continue même quand la souris va vite.
      const pas = Math.max(1, Math.ceil(dist / 6));
      for (let i = 1; i <= pas; i++) points.push({ x: dernier + dx * i / pas, y: dernierY + dy * i / pas, t });
      dernier = x; dernierY = y;
      vitesse = Math.min(1, vitesse * 0.7 + dist / 60);
    }

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const t = performance.now();
      ajouter(e.clientX, e.clientY, t);
      tx = e.clientX; ty = e.clientY;
      if (!actif) { actif = true; tPrec = t; requestAnimationFrame(dessiner); }
    }, { passive: true });

    function dessiner() {
      // Une seule horloge (celle des événements souris) : l'horodatage fourni
      // par requestAnimationFrame peut différer et fausser l'âge des points.
      const t = performance.now();
      const dt = Math.min(Math.max(t - tPrec, 0), 64); tPrec = t;
      ctx.clearRect(0, 0, W, H);

      // Trace : fine et légère, elle s'amenuise jusqu'à disparaître.
      while (points.length && t - points[0].t > VIE) points.shift();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const k = clamp(1 - (t - p.t) / VIE, 0, 1);   // 1 = tout neuf, 0 = éteint
        const r = 3 + 14 * k * k;
        ctx.globalAlpha = 0.085 * k * k * force;
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
      }

      // Halo de tête : il suit le curseur avec un peu de retard. Son éclat
      // monte quand la souris bouge et retombe en douceur quand elle s'arrête.
      const lisse = 1 - Math.pow(0.82, dt / 16.7);
      hx += (tx - hx) * lisse; hy += (ty - hy) * lisse;
      vitesse *= Math.pow(0.9, dt / 16.7);
      const cible = 0.25 + vitesse * 0.75;
      eclat += (cible * (points.length ? 1 : 0) - eclat) * (1 - Math.pow(0.93, dt / 16.7));
      if (eclat > 0.004) {
        const R = 90 + vitesse * 30;
        ctx.globalAlpha = 0.16 * eclat * force;
        ctx.drawImage(sprite, hx - R, hy - R, R * 2, R * 2);
      }

      ctx.globalAlpha = 1;
      // On s'arrête une fois tout éteint ; la toile est alors vide, sans saut visible.
      if (points.length || eclat > 0.004) requestAnimationFrame(dessiner);
      else { ctx.clearRect(0, 0, W, H); actif = false; }
    }
    requestAnimationFrame(dessiner); actif = true;
  }

  /* ── Changement de thème en cercle ────────────────────────────
     Appelé par le bouton de thème des deux pages (voir leur script). */
  window.v4Theme = function (btn, appliquer) {
    if (reduce || !document.startViewTransition) { appliquer(); return; }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rayon = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('v4-vt-theme', 'v4-no-tr');
    const t = document.startViewTransition(appliquer);
    t.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rayon}px at ${x}px ${y}px)`] },
        { duration: 650, easing: EASE, pseudoElement: '::view-transition-new(root)' });
    });
    t.finished.finally(() => root.classList.remove('v4-vt-theme', 'v4-no-tr'));
  };

  /* ── Transition carte → page projet (View Transitions entre pages) ──
     Le visuel cliqué et le bandeau de la page détail portent le même nom :
     le navigateur fait le morphing. Sans support, navigation classique. */
  // Transitions natives entre pages : Chrome, Edge et Safari récents, en http(s).
  const vtNatif = 'CSSViewTransitionRule' in window && location.protocol !== 'file:';

  // Sans support natif (Firefox, fichier ouvert en local) : on rejoue l'effet
  // à la main, le visuel cliqué s'agrandit jusqu'à la place du bandeau.
  function transitionRepli(lien, e) {
    const img = lien.querySelector('img');
    if (!img || reduce || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const r = img.getBoundingClientRect();
    const clone = img.cloneNode();
    clone.className = 'v4-vt-clone';
    Object.assign(clone.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: getComputedStyle(img).borderRadius });
    const voile = document.createElement('div');
    voile.className = 'v4-vt-voile';
    document.body.append(voile, clone);
    const haut = 88, hauteur = clamp(innerWidth * 0.32, 220, 420);
    voile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'forwards' });
    clone.animate([{ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' },
      { left: '0px', top: haut + 'px', width: innerWidth + 'px', height: hauteur + 'px', borderRadius: '0px' }],
      { duration: 600, easing: EASE, fill: 'forwards' }).onfinish = () => {
      try { sessionStorage.setItem('v4-vt', 'repli'); } catch (err) {}
      location.href = lien.href;
    };
  }

  function nommerVisuel(lien, e) {
    // Mémorise d'où l'on part, pour revenir au même endroit en fermant le projet.
    try {
      const id = new URL(lien.href, location.href).searchParams.get('id');
      sessionStorage.setItem('v4-retour', JSON.stringify({ id, y: scrollY }));
    } catch (err) {}
    if (!vtNatif && e) { transitionRepli(lien, e); return; }
    const img = lien.querySelector('img');
    if (!img) return;
    document.querySelectorAll('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = ''; });
    img.style.viewTransitionName = 'visuel-projet';
    const id = new URL(lien.href, location.href).searchParams.get('id');
    try { sessionStorage.setItem('v4-vt', id || ''); } catch (e) {}
  }
  addEventListener('pageshow', e => { if (e.persisted && !isDetail) { try { sessionStorage.removeItem('v4-retour'); } catch (err) {} } });

  addEventListener('pagereveal', e => {
    if (isDetail || !e.viewTransition) return;
    // Retour depuis une page projet : le bandeau revient sur sa carte.
    let id = null;
    try { id = sessionStorage.getItem('v4-vt-retour'); sessionStorage.removeItem('v4-vt-retour'); } catch (err) {}
    if (!id) return;
    const img = [...document.querySelectorAll(`.v4-carte-${id} img`)].find(i => i.offsetParent !== null);
    if (img) { img.style.viewTransitionName = 'visuel-projet'; e.viewTransition.finished.finally(() => { img.style.viewTransitionName = ''; }); }
  });

  /* ══════════════════════════════════════════════════════════════
     PAGE D'ACCUEIL
     ══════════════════════════════════════════════════════════════ */
  const isAccueil = !!document.getElementById('accueil');
  if (isAccueil) document.addEventListener('DOMContentLoaded', initAccueil);

  /* Autres pages (404) : décor qui suit la souris, entrée en cascade des
     blocs marqués data-v4-cascade, panneau de démo. */
  if (!isAccueil && !isDetail) document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-v4-cascade]').forEach(bloc =>
      [...bloc.children].forEach((el, i) => reveal(el, 0.15 + i * 0.14)));
    animerDecor();
    initPanneau();
    requestAnimationFrame(tick);
  });

  function initAccueil() {
    const header = document.querySelector('.v2-header');
    const majNav = () => root.style.setProperty('--v4-nav', (header ? header.offsetHeight : 80) + 'px');
    majNav(); addEventListener('resize', majNav);

    /* Hero : entrée en cascade */
    const h = document.querySelector('.v2-hero-text');
    if (h) {
      const parts = [h.querySelector('.v2-hero-name'), ...h.querySelectorAll('.v2-headline > *'), ...h.querySelectorAll('.v2-tagline p')];
      parts.forEach((el, i) => {
        if (!el) return;
        // Le grand titre est l'élément mesuré par le LCP : un élément à opacité 0
        // n'est pas compté avant d'apparaître. Il glisse et se défloute, sans fondu.
        if (i > 0 && i < 3) el.classList.add('v4-blur', 'v4-sans-fondu');
        if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'; // transform sans effet sur un inline
        reveal(el, 0.1 + i * 0.12);
      });
      document.querySelectorAll('.v2-hero-card').forEach((c, i) => reveal(c, 0.75 + i * 0.1));
      root.classList.add('v4-pret');   // les classes v4-in ont pris le relais de l'état de départ
    }

    /* Titres de section */
    document.querySelectorAll('.v2-section-head').forEach(t => { t.classList.add('v4-titre'); onView(t, () => t.classList.add('v4-vu')); });

    animerDecor();
    suiteAccueil();
  }

  /* Décor : le halo et les anneaux suivent la souris, les anneaux tournent lentement */
  function animerDecor() {
    const glow = document.querySelector('.v2-decor-glow'), rings = document.querySelector('.v2-decor-rings');
    if (glow && rings && !reduce) {
      let tx = 0, ty = 0, gx = 0, gy = 0, t = 0;
      addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); } }, { passive: true });
      (function frame() {
        t += 0.0025; gx += (tx - gx) * 0.04; gy += (ty - gy) * 0.04;
        glow.style.transform = `translate(${gx * 90}px, ${gy * 70}px)`;
        rings.style.transform = `translate(${gx * -40}px, ${gy * -30}px) rotate(${t * 20}deg)`;
        requestAnimationFrame(frame);
      })();
    }
  }

  function suiteAccueil() {
    /* Navigation : soulignement qui glisse vers la section en cours */
    const liens = document.querySelector('.v2-nav-links');
    if (liens) {
      const ink = document.createElement('span');
      ink.className = 'v4-ink'; ink.setAttribute('aria-hidden', 'true');
      liens.appendChild(ink);
      let prec = null;
      const maj = () => {
        const a = liens.querySelector('.v2-nav-link.active');
        if (!a) { ink.style.opacity = 0; return; }
        ink.style.opacity = 1;
        ink.style.width = a.offsetWidth - 8 + 'px';
        ink.style.transform = `translateX(${a.offsetLeft + 4}px)`;
        if (!prec) { ink.style.transition = 'none'; requestAnimationFrame(() => { ink.style.transition = ''; }); }
        prec = a;
      };
      onScroll.push(maj); maj();
    }

    /* Défilement doux vers les ancres */
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const cible = document.querySelector(a.getAttribute('href'));
      if (!cible || reduce) return;
      e.preventDefault();
      cible.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
    }));

    /* Cartes de la grille actuelle : nommer le visuel au clic */
    document.querySelectorAll('.v2-project-card').forEach(c => {
      const id = new URL(c.href, location.href).searchParams.get('id');
      c.classList.add('v4-carte-' + id);
      c.addEventListener('click', e => nommerVisuel(c, e));
    });

    initProjets();
    initAutres();
    initTexteAllume();
    revenirALaCarte();
    initPanneau();
    requestAnimationFrame(tick);
  }

  /* ── Projets : cartes empilées ─────────────────────────────────
     Elles remplacent la grille (masquée par la classe v4-mode-pile). */

  function initProjets() {
    const grille = document.getElementById('projets-grid');
    if (!grille || typeof PROJETS === 'undefined') return;
    root.classList.add('v4-mode-pile');

    const pile = document.createElement('div');
    pile.className = 'v4-pile';
    pile.innerHTML = PROJETS.map((p, i) => {
      const en = p.en || {};
      return `<a href="projet-detail.html?id=${p.id}" class="v4-pile-card v4-carte-${p.id}" style="top:calc(var(--v4-nav) + 24px + ${i * 14}px)">
        <div class="v4-pile-visuel"><img src="${esc(p.thumb)}" alt="" loading="lazy"></div>
        <div class="v4-pile-texte">
          <span class="v4-num">${esc(p.num)}</span>
          <p class="v2-project-client" ${bi(p.clientCourt, en.clientCourt)}>${txt(p.clientCourt, en.clientCourt)}</p>
          <h3 class="v2-project-title" ${bi(p.titreCourt, en.titreCourt)}>${txt(p.titreCourt, en.titreCourt)}</h3>
          <p class="v2-project-desc" ${bi(p.sousTitreCourt, en.sousTitreCourt)}>${txt(p.sousTitreCourt, en.sousTitreCourt)}</p>
          <span class="v4-voir" ${bi('Voir le projet', 'View project')}>${txt('Voir le projet', 'View project')}</span>
        </div>
        <span class="v4-pile-veil" aria-hidden="true"></span>
      </a>`;
    }).join('');
    grille.after(pile);
    const cartes = [...pile.querySelectorAll('.v4-pile-card')];
    onScroll.push(() => {
      if (reduce) return;
      cartes.forEach((c, i) => {
        const suiv = cartes[i + 1];
        if (!suiv) return;
        const a = c.getBoundingClientRect(), b = suiv.getBoundingClientRect();
        const p = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        c.style.transform = `scale(${1 - p * 0.06})`;
        c.lastElementChild.style.opacity = p * 0.55;
      });
    });

    pile.querySelectorAll('a').forEach(a => a.addEventListener('click', e => nommerVisuel(a, e)));
  }

  /* ── Retour depuis une page projet ─────────────────────────────
     La page reprend la position quittée (la carte du projet est donc à
     l'écran), au lieu de l'ancre #projets ou du haut de page. Sans position
     mémorisée, on centre la carte du projet. */
  function revenirALaCarte() {
    let retour = null;
    try { retour = JSON.parse(sessionStorage.getItem('v4-retour') || 'null'); sessionStorage.removeItem('v4-retour'); } catch (e) {}
    const id = new URLSearchParams(location.search).get('projet') || (retour && retour.id);
    if (!id) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const aller = () => {
      if (retour && typeof retour.y === 'number' && retour.id === id) {
        scrollTo({ top: retour.y, behavior: 'instant' });
      } else {
        const carte = [...document.querySelectorAll('.v4-carte-' + id)].find(c => c.offsetParent !== null);
        if (carte) scrollTo({ top: carte.getBoundingClientRect().top + scrollY - (innerHeight - carte.offsetHeight) / 2, behavior: 'instant' });
      }
      requestAnimationFrame(tick);
    };
    aller();
    // Les images chargées après coup peuvent décaler la page : on recale une fois.
    addEventListener('load', aller, { once: true });
  }

  /* ── Texte qui s'allume à la lecture ──────────────────────────
     Les paragraphes du parcours (À propos) sont d'abord grisés ; les mots
     s'allument un à un au fil du défilement. applyLang() réécrit le texte
     à chaque changement de langue : on redécoupe alors les mots. */
  function initTexteAllume() {
    const paras = [...document.querySelectorAll('.v2-tl-text')];
    if (!paras.length || reduce) return;
    let mots = [];
    function decouper() {
      mots = paras.map(p => {
        p.innerHTML = p.textContent.trim().split(/(\s+)/).map(m => m.trim() ? `<span class="v4-mot">${esc(m)}</span>` : m).join('');
        return { p, spans: [...p.querySelectorAll('.v4-mot')] };
      });
      requestAnimationFrame(tick);
    }
    decouper();
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', decouper));
    onScroll.push(() => {
      const vh = innerHeight;
      mots.forEach(({ p, spans }) => {
        const r = p.getBoundingClientRect();
        const k = clamp((vh * 0.9 - r.top) / (r.height + vh * 0.45), 0, 1);
        const n = spans.length;
        spans.forEach((sp, i) => { sp.style.opacity = clamp(k * n * 1.15 - i, 0.18, 1); });
      });
    });
  }

  /* ── Accordéon « Autres projets » : dépliage en douceur ───────── */
  function initAutres() {
    const d = document.querySelector('.v2-autres');
    if (!d) return;
    const sum = d.querySelector('summary'), corps = d.querySelector('.v2-autres-body');
    let anim = null;
    function basculer(ouvrir) {
      if (anim) anim.cancel();
      const depart = d.offsetHeight;
      if (ouvrir) d.open = true;
      const arrivee = ouvrir ? sum.offsetHeight + corps.offsetHeight + 2 : sum.offsetHeight + 2;
      if (reduce) { d.open = ouvrir; return; }
      d.style.overflow = 'hidden';
      anim = d.animate({ height: [depart + 'px', arrivee + 'px'] }, { duration: ouvrir ? 700 : 400, easing: EASE });
      if (ouvrir) {
        const items = [corps.querySelector('.v2-autres-intro'), ...corps.querySelectorAll('.v2-autre-card')].filter(Boolean);
        items.forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, delay: 140 + i * 80, easing: EASE, fill: 'backwards' }));
      }
      anim.onfinish = () => { if (!ouvrir) d.open = false; d.style.overflow = ''; anim = null; };
    }
    sum.addEventListener('click', e => { e.preventDefault(); basculer(!d.open); });
  }

  /* ── Panneau de démo ─────────────────────────────────────────── */
  function initPanneau() {
    // Uniquement sur les fichiers de démonstration (index.html, 404.html).
    if (!/-v4\.html$/.test(location.pathname)) return;
    const p = document.createElement('aside');
    p.className = 'v4-panel';
    p.setAttribute('aria-label', 'Réglages de la démo');
    p.innerHTML = `<b>Démo v4</b>
      <a href="index.html">Comparer avec la version actuelle</a>
      <button type="button" class="v4-panel-fermer" aria-label="Replier le panneau">×</button>
      <button type="button" class="v4-panel-ouvrir">Démo v4</button>`;
    document.body.appendChild(p);
    const replier = v => { p.classList.toggle('v4-replie', v); try { localStorage.setItem('v4-panneau', v ? '1' : ''); } catch (e) {} };
    p.querySelector('.v4-panel-fermer').addEventListener('click', () => replier(true));
    p.querySelector('.v4-panel-ouvrir').addEventListener('click', () => replier(false));
    try { if (localStorage.getItem('v4-panneau')) replier(true); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     PAGE PROJET
     ══════════════════════════════════════════════════════════════ */
  let bandeauJoue = false;

  // Appelée par render() à chaque rendu (projet ou langue).
  window.v4Detail = function () {
    const contenu = document.getElementById('detail-content');
    if (!contenu) return;

    /* Bandeau : s'ouvre au chargement (sauf arrivée par la transition de page) */
    if (!bandeauJoue) {
      bandeauJoue = true;
      let viaTransition = false;
      try { viaTransition = !!sessionStorage.getItem('v4-vt'); sessionStorage.removeItem('v4-vt'); } catch (e) {}
      const b = document.querySelector('.detail-banner');
      if (b && !reduce && !viaTransition) {
        b.classList.add('v4-banner-intro');
        requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('v4-banner-go')));
        setTimeout(() => b.classList.remove('v4-banner-intro', 'v4-banner-go'), 1500);
      }
    }

    /* Contenu en cascade : chaque bloc monte à son arrivée à l'écran ;
       dans une grille, les éléments voisins se suivent de près. */
    const blocs = contenu.querySelectorAll(':scope > h1, :scope > p, :scope > .section-label, :scope > .section-text, :scope > .enjeux-block, .meta-cell, .objectifs-list li, .steps-list li, .methodo-card, .defi-card, .kpi-card, .competences-wrap .tag');
    blocs.forEach(el => {
      const freres = el.parentElement === contenu ? 0 : [...el.parentElement.children].indexOf(el);
      reveal(el, Math.min(freres, 8) * 0.07);
    });

    /* Chiffres clés : les caractères défilent puis se figent */
    contenu.querySelectorAll('.kpi-titre').forEach((k, i) => onView(k, () => decoder(k, 250 + i * 150)));

    /* Galerie */
    const galerie = contenu.querySelector('.gallery');
    if (galerie) { regrouperPortraits(galerie); poserVisuels(galerie); sequences(galerie); }
    requestAnimationFrame(tick);
  };

  function decoder(el, delai) {
    const fin = el.textContent.trim();
    if (reduce || !fin) return;
    const CH = '0123456789%#@&$+=<>ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    el.textContent = fin.replace(/\S/g, '·');
    setTimeout(() => {
      let t0 = null;
      requestAnimationFrame(function pas(ts) {
        if (!t0) t0 = ts;
        const k = (ts - t0) / 900;
        let out = '';
        for (let i = 0; i < fin.length; i++) out += (fin[i] === ' ' || k > (i + 1) / fin.length * 0.85) ? fin[i] : CH[Math.floor(Math.random() * CH.length)];
        el.textContent = out;
        if (k < 1) requestAnimationFrame(pas); else el.textContent = fin;
      });
    }, delai);
  }

  /* Visuels : s'ouvrent d'un cadre resserré et se posent en se dézoomant */
  let poses = [];
  function poserVisuels(galerie) {
    poses = [...galerie.querySelectorAll('.shot')].filter(s => !s.closest('.v4-strip'));
    if (reduce) return;
    poses.forEach(s => s.classList.add('v4-pose'));
  }
  onScroll.push(() => {
    if (reduce) return;
    const vh = innerHeight;
    poses.forEach(s => {
      if (!s.isConnected) return;
      const r = s.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 0.7), 0, 1);
      const c = (1 - p) * 9;
      s.style.clipPath = p >= 1 ? '' : `inset(${c}% ${c}% ${c}% ${c}% round 14px)`;
      const img = s.querySelector('.shot-media img, .shot-anim');
      if (img) img.style.scale = p >= 1 ? '' : String(1.15 - p * 0.15);
    });
  });

  /* Séquences animées : elles avancent avec le défilement */
  let seqs = [];
  function sequences(galerie) {
    seqs = [...galerie.querySelectorAll('.shot-anim')].map(bloc => {
      const frames = [...bloc.querySelectorAll('img')];
      if (frames.length < 2) return null;
      const points = document.createElement('div');
      points.className = 'v4-etapes'; points.setAttribute('aria-hidden', 'true');
      points.innerHTML = frames.map(() => '<i></i>').join('');
      bloc.appendChild(points);
      return { bloc, frames, points: [...points.children] };
    }).filter(Boolean);
  }
  onScroll.push(() => {
    seqs.forEach(({ bloc, frames, points }) => {
      if (!bloc.isConnected) return;
      const r = bloc.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 0.999);
      const idx = reduce ? 0 : Math.floor(p * frames.length);
      frames.forEach((f, n) => f.classList.toggle('is-on', n === idx && n > 0));
      points.forEach((pt, n) => pt.classList.toggle('on', n === idx));
    });
  });

  /* Écrans mobiles : les portraits consécutifs passent en bande à faire glisser */
  function regrouperPortraits(galerie) {
    const figures = [...galerie.children];
    let groupe = [];
    const vider = () => {
      if (groupe.length >= 3) {
        const bande = document.createElement('div');
        bande.className = 'v4-strip';
        groupe[0].before(bande);
        groupe.forEach(f => bande.appendChild(f));
        const nav = document.createElement('div');
        nav.className = 'v4-strip-nav';
        nav.innerHTML = `<button type="button" data-d="-1" aria-label="${lang() === 'en' ? 'Previous screen' : 'Écran précédent'}"><span class="material-icons-round" aria-hidden="true">arrow_back</span></button>
          <button type="button" data-d="1" aria-label="${lang() === 'en' ? 'Next screen' : 'Écran suivant'}"><span class="material-icons-round" aria-hidden="true">arrow_forward</span></button>`;
        bande.after(nav);
        activerBande(bande, nav);
      }
      groupe = [];
    };
    figures.forEach(f => { if (f.classList.contains('shot--narrow')) groupe.push(f); else vider(); });
    vider();
  }
  function activerBande(bande, nav) {
    const items = [...bande.children];
    const maj = () => {
      const c = bande.scrollLeft + bande.clientWidth / 2;
      items.forEach(it => {
        const d = Math.min(1, Math.abs(c - (it.offsetLeft + it.offsetWidth / 2)) / 420);
        it.style.transform = reduce ? '' : `scale(${1 - d * 0.12})`;
        it.style.opacity = String(1 - d * 0.4);
      });
    };
    bande.addEventListener('scroll', () => requestAnimationFrame(maj), { passive: true });
    let bas = false, x0 = 0, s0 = 0, bouge = false;
    bande.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; bas = true; bouge = false; x0 = e.clientX; s0 = bande.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!bas) return;
      const dx = e.clientX - x0;
      if (!bouge && Math.abs(dx) > 4) { bouge = true; bande.classList.add('v4-drag'); }
      if (bouge) bande.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!bas) return; bas = false;
      if (!bouge) return;
      bande.classList.remove('v4-drag');
      const c = bande.scrollLeft + bande.clientWidth / 2;
      let mieux = items[0], ecart = Infinity;
      items.forEach(it => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - c); if (d < ecart) { ecart = d; mieux = it; } });
      bande.scrollTo({ left: mieux.offsetLeft + mieux.offsetWidth / 2 - bande.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    });
    // Après un glissé, le relâchement ne doit pas ouvrir la visionneuse.
    bande.addEventListener('click', e => { if (bouge) { e.stopPropagation(); e.preventDefault(); bouge = false; } }, true);
    nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      bande.scrollBy({ left: +b.dataset.d * (items[0].offsetWidth + 18), behavior: reduce ? 'auto' : 'smooth' });
    }));
    requestAnimationFrame(() => { bande.scrollLeft = 0; maj(); });
  }

  /* Visionneuse : l'image s'agrandit depuis sa place et y retourne */
  if (isDetail) {
    const vis = document.getElementById('visionneuse');
    const visImg = document.getElementById('visionneuse-img');
    let source = null, retour = null, fermeture = false;
    const fond = vis ? getComputedStyle(vis).backgroundColor : '';

    document.addEventListener('click', e => {
      let img = e.target.closest && e.target.closest('.gallery img, #detail-banner-img');
      if (!img) return;
      const anim = img.closest('.shot-anim');
      if (anim) img = anim.querySelector('img.is-on') || anim.querySelector('img');
      source = img; retour = document.activeElement;
      // La page ouvre la visionneuse dans son propre gestionnaire ; on anime juste après.
      setTimeout(() => {
        if (!vis || vis.hidden || reduce) return;
        // L'image doit être décodée pour connaître sa taille finale.
        if (!visImg.complete || !visImg.naturalWidth) {
          vis.style.visibility = 'hidden';
          visImg.decode().then(ouvrir, () => { vis.style.visibility = ''; });
        } else ouvrir();
      }, 0);
    }, true);

    function ouvrir() {
        vis.style.visibility = '';
        const a = source.getBoundingClientRect(), b = visImg.getBoundingClientRect();
        if (!b.width) return;
        visImg.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, borderRadius: '14px' },
          { transform: 'none', borderRadius: '0px' }], { duration: 560, easing: EASE });
        visImg.style.transformOrigin = '0 0';
        vis.animate([{ backgroundColor: 'rgba(0,0,0,0)' }, { backgroundColor: fond }], { duration: 400, easing: 'ease' });
        vis.querySelectorAll('.visionneuse-legende, .visionneuse-fermer').forEach(el =>
          el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 300, easing: EASE, fill: 'backwards' }));
    }

    function fermer(e) {
      if (!vis || vis.hidden || fermeture || reduce || !source) return;
      e.stopImmediatePropagation(); e.preventDefault();
      fermeture = true;
      const a = source.getBoundingClientRect(), b = visImg.getBoundingClientRect();
      const an = visImg.animate([{ transform: 'none' }, { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, borderRadius: '14px' }],
        { duration: 420, easing: EASE, fill: 'forwards' });
      vis.animate([{ backgroundColor: fond }, { backgroundColor: 'rgba(0,0,0,0)' }], { duration: 420, easing: 'ease', fill: 'forwards' });
      vis.querySelectorAll('.visionneuse-legende, .visionneuse-fermer').forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }));
      an.onfinish = () => {
        vis.hidden = true; visImg.src = ''; document.body.style.overflow = '';
        vis.getAnimations({ subtree: true }).forEach(x => x.cancel());
        if (retour && retour.focus) retour.focus();
        fermeture = false; source = null;
      };
    }
    document.addEventListener('click', e => { if (e.target === vis || (e.target.closest && e.target.closest('.visionneuse-fermer'))) fermer(e); }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') fermer(e); }, true);

    /* Bandeau : léger effet de profondeur au défilement */
    const bImg = document.getElementById('detail-banner-img');
    if (bImg && !reduce) onScroll.push(() => { bImg.style.translate = `0 ${Math.min(scrollY, 600) * 0.18}px`; });

    /* Retour vers l'accueil : on revient sur la carte du projet, pas en haut de page.
       Si l'on arrive de l'accueil, un retour arrière rend la page exactement
       dans l'état quitté (position, mode de projets) ; sinon on ouvre
       l'accueil en lui indiquant la carte à afficher.
       L'adresse de l'accueil est lue sur la croix : le script ne dépend pas du
       nom des fichiers (index.html en démo, index.html une fois déployé). */
    const memePage = (a, b) => a.replace(/\/index\.html$/, '/') === b.replace(/\/index\.html$/, '/');
    document.querySelectorAll('.v2-close-btn').forEach(a => a.addEventListener('click', e => {
      const accueil = a.getAttribute('href').split('#')[0];
      const id = new URLSearchParams(location.search).get('id') || '1';
      try { sessionStorage.setItem('v4-vt-retour', id); } catch (err) {}
      let depuisAccueil = false;
      try { depuisAccueil = memePage(new URL(document.referrer).pathname, new URL(accueil, location.href).pathname) && history.length > 1; } catch (err) {}
      e.preventDefault();
      if (depuisAccueil) history.back();
      else location.href = accueil + '?projet=' + id;
    }));
  }
})();
