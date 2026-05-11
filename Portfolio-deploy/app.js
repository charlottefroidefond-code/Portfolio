const MODES = ['aube', 'jour', 'crepuscule', 'nuit'];

const MODE_LABELS = {
  aube:       'Aube',
  jour:       'Jour',
  crepuscule: 'Crépuscule',
  nuit:       'Nuit',
};

function getModeByHour(h) {
  if (h >= 5  && h < 10) return 'aube';
  if (h >= 10 && h < 17) return 'jour';
  if (h >= 17 && h < 21) return 'crepuscule';
  return 'nuit';
}

function applyMode(mode, save = true) {
  document.documentElement.setAttribute('data-mode', mode);

  // Background crossfade
  document.querySelectorAll('.bg-img').forEach(img => {
    img.classList.toggle('active', img.dataset.mode === mode);
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (save) sessionStorage.setItem('portfolio-mode', mode);
}

function initMode() {
  // Auto-detect from local time; respect manual override within the session
  const saved = sessionStorage.getItem('portfolio-mode');
  const auto  = getModeByHour(new Date().getHours());
  applyMode(saved && MODES.includes(saved) ? saved : auto, false);

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => applyMode(btn.dataset.mode));
  });
}

// Active nav : scroll-based sur la one-page, pathname sur les autres pages
function initNav() {
  const sections = ['accueil', 'projets', 'a-propos', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (sections.length > 0) {
    function updateActive() {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let current = sections[0];
      for (const s of sections) {
        if (s.offsetTop <= mid) current = s;
      }
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  } else {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
    });
  }
}

// ── Langue (partagé toutes pages) ─────────────────────
function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.dataset[lang] || el.textContent;
  });
  const placeholderKey = `placeholder${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    el.placeholder = el.dataset[placeholderKey] || el.placeholder;
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  sessionStorage.setItem('portfolio-lang', lang);
}

function initLang() {
  const saved = sessionStorage.getItem('portfolio-lang') || 'en';
  applyLang(saved);
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => applyLang(btn.dataset.lang))
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initMode();
  initNav();
  initLang();
});
