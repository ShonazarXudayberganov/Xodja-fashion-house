/* ============== STATE ============== */
let SITE = null;
let currentLang = localStorage.getItem('xfh_lang') || 'uz';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function setBi(el, uz, ru) {
  if (!el) return;
  if (uz != null) el.dataset.uz = uz;
  if (ru != null) el.dataset.ru = ru || uz;
}

/* ============== API ============== */
async function fetchSite() {
  const res = await fetch('/api/site', { cache: 'no-store' });
  if (!res.ok) throw new Error('API ' + res.status);
  return res.json();
}
async function postOrder(payload) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/* ============== RENDER: HEAD ============== */
function renderHead(s) {
  if (s['meta.title']) document.title = s['meta.title'];

  const setMeta = (sel, val) => {
    const m = document.querySelector(sel);
    if (m && val) m.setAttribute('content', val);
  };
  const desc = s['meta.description_' + currentLang] || s['meta.description_uz'];
  setMeta('meta[name="description"]', desc);
  setMeta('meta[name="keywords"]', s['meta.keywords']);
  setMeta('meta[name="theme-color"]', s['meta.theme_color']);
  setMeta('meta[property="og:title"]', s['meta.title']);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[property="og:image"]', s['meta.og_image']);
  setMeta('meta[name="twitter:title"]', s['meta.title']);
  setMeta('meta[name="twitter:description"]', desc);
  setMeta('meta[name="twitter:image"]', s['meta.og_image']);

  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld) {
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: s['brand.name'] || 'Xodija Fashion House',
      description: s['meta.description_uz'] || '',
      telephone: s['contacts.phone'] || '',
      address: {
        '@type': 'PostalAddress',
        addressLocality: s['about.badge_location_uz'] || 'Xiva',
        addressRegion: 'Xorazm',
        addressCountry: 'UZ',
      },
      sameAs: [
        s['contacts.telegram_username'] ? `https://t.me/${s['contacts.telegram_username']}` : null,
        s['contacts.instagram_username'] ? `https://instagram.com/${s['contacts.instagram_username']}` : null,
      ].filter(Boolean),
      priceRange: '$$',
    }, null, 2);
  }
}

/* ============== RENDER: BRAND ============== */
function renderBrand(s) {
  const short = s['brand.short'] || 'Xodija';
  const fashion = s['brand.fashion_text'] || 'Fashion House';
  const mark = s['brand.logo_mark'] || 'XH';

  $$('.logo-text').forEach(el => {
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = short + ' ';
    const span = el.querySelector('span');
    if (span) span.textContent = fashion;
  });
  $$('.logo-mark').forEach(el => el.textContent = mark);
}

/* ============== RENDER: HERO ============== */
function renderHero(data) {
  const s = data.settings;

  setBi($('.hero-eyebrow'), s['hero.eyebrow_uz'], s['hero.eyebrow_ru']);

  const heroTitle = $('.hero-title');
  if (heroTitle) {
    const titleText = s['hero.title'] || 'Xodija';
    if (heroTitle.firstChild && heroTitle.firstChild.nodeType === 3) {
      heroTitle.firstChild.textContent = titleText + '\n          ';
    }
    const accent = heroTitle.querySelector('.accent');
    if (accent) {
      const acc = s['hero.title_accent'] || 'Fashion House';
      setBi(accent, acc, acc);
    }
  }

  setBi($('.hero-sub'), s['hero.subtitle_uz'], s['hero.subtitle_ru']);

  const ctas = $$('.hero-ctas a');
  if (ctas[0]) {
    ctas[0].setAttribute('href', s['hero.cta1_link'] || '#catalog');
    setBi(ctas[0].querySelector('span'), s['hero.cta1_text_uz'], s['hero.cta1_text_ru']);
  }
  if (ctas[1]) {
    ctas[1].setAttribute('href', s['hero.cta2_link'] || '#order');
    setBi(ctas[1].querySelector('span'), s['hero.cta2_text_uz'], s['hero.cta2_text_ru']);
  }

  const b1 = $('.floating-badge.b1');
  if (b1) {
    const strong = b1.querySelector('strong');
    if (strong) strong.textContent = s['hero.badge1_value'] || '910+';
    setBi(b1.querySelector('span span'), s['hero.badge1_label_uz'], s['hero.badge1_label_ru']);
  }
  const b2 = $('.floating-badge.b2');
  if (b2) {
    const strong = b2.querySelector('strong');
    if (strong) strong.textContent = s['hero.badge2_value'] || '10';
    setBi(b2.querySelector('span span'), s['hero.badge2_label_uz'], s['hero.badge2_label_ru']);
  }

  setBi($('#heroCardLabel'), s['hero.card_label_uz'], s['hero.card_label_ru']);

  const slidesContainer = $('#slidesContainer');
  const dotsContainer = $('#sliderDots');
  if (slidesContainer && dotsContainer) {
    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    (data.heroSlides || []).forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = 'slide' + (i === 0 ? ' active' : '');
      const altUz = slide.alt_uz || '';
      const altRu = slide.alt_ru || altUz;
      div.innerHTML = `<img src="${esc(slide.image_path)}" alt="${esc(currentLang === 'ru' ? altRu : altUz)}" data-uz="${esc(altUz)}" data-ru="${esc(altRu)}" width="800" height="1000" ${i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
      slidesContainer.appendChild(div);

      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.setAttribute('aria-label', `${i + 1}-rasm`);
      dotsContainer.appendChild(dot);
    });
  }
}

/* ============== RENDER: MARQUEE ============== */
function renderMarquee(items) {
  const inner = $('#marqueeInner');
  if (!inner) return;
  inner.innerHTML = '';
  const list = items || [];
  const make = (it) => {
    const span = document.createElement('span');
    span.className = 'marquee-item';
    span.innerHTML = `<i class="fa-solid fa-diamond"></i> <span data-uz="${esc(it.text_uz || '')}" data-ru="${esc(it.text_ru || it.text_uz || '')}">${esc(currentLang === 'ru' ? (it.text_ru || it.text_uz) : it.text_uz)}</span>`;
    return span;
  };
  list.forEach(it => inner.appendChild(make(it)));
  list.forEach(it => inner.appendChild(make(it)));

  startInfiniteScroll(inner, 20000);
}

/* ============== RENDER: ABOUT ============== */
function renderAbout(s) {
  const img = $('.about-visual img');
  if (img && s['about.image_path']) img.src = s['about.image_path'];

  setBi($('#about .section-eyebrow'), s['about.eyebrow_uz'], s['about.eyebrow_ru']);
  setBi($('#aboutTitle'), s['about.title_uz'], s['about.title_ru']);
  setBi($('.about-content p'), s['about.text_uz'], s['about.text_ru']);

  const tag = $('.about-tag-text');
  if (tag) {
    setBi(tag.querySelector('span'), s['about.badge_text_uz'], s['about.badge_text_ru']);
    setBi(tag.querySelector('small'), s['about.badge_location_uz'], s['about.badge_location_ru']);
  }

  const stats = $$('.stat');
  for (let i = 0; i < 3; i++) {
    if (!stats[i]) continue;
    const num = stats[i].querySelector('.stat-num');
    const lbl = stats[i].querySelector('.stat-label');
    if (num && s[`about.stat${i + 1}_value`]) num.textContent = s[`about.stat${i + 1}_value`];
    setBi(lbl, s[`about.stat${i + 1}_label_uz`], s[`about.stat${i + 1}_label_ru`]);
  }
}

/* ============== RENDER: CATALOG ============== */
function renderCatalog(data) {
  const s = data.settings;

  setBi($('#catalog .section-eyebrow'), s['catalog.eyebrow_uz'], s['catalog.eyebrow_ru']);
  setBi($('#catalogTitle'), s['catalog.title_uz'], s['catalog.title_ru']);
  setBi($('#catalog .section-sub'), s['catalog.subtitle_uz'], s['catalog.subtitle_ru']);

  const tabs = $('#filterTabs');
  if (tabs) {
    tabs.innerHTML = '';
    const all = document.createElement('button');
    all.className = 'filter-tab active';
    all.dataset.filter = 'all';
    all.setAttribute('role', 'tab');
    all.setAttribute('aria-selected', 'true');
    all.dataset.uz = 'Hammasi';
    all.dataset.ru = 'Все';
    all.textContent = currentLang === 'ru' ? 'Все' : 'Hammasi';
    tabs.appendChild(all);
    (data.categories || []).forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-tab';
      btn.dataset.filter = cat.slug;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.dataset.uz = cat.name_uz;
      btn.dataset.ru = cat.name_ru || cat.name_uz;
      btn.textContent = currentLang === 'ru' ? (cat.name_ru || cat.name_uz) : cat.name_uz;
      tabs.appendChild(btn);
    });
  }

  const grid = $('#productGrid');
  if (grid) {
    grid.innerHTML = '';
    const tg = s['contacts.telegram_username'] || 'xodija_fashion';
    (data.products || []).forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card reveal';
      card.dataset.cat = p.category_slug || '';

      const badge = p.badge_type
        ? `<span class="product-badge badge-${esc(p.badge_type)}" data-uz="${esc(p.badge_text || '')}" data-ru="${esc(p.badge_text || '')}">${esc(p.badge_text || '')}</span>`
        : '';
      const priceHtml = p.price_ask
        ? `<div class="product-price ask" data-uz="Narx so'rash" data-ru="Узнать цену">Narx so'rash</div>`
        : `<div class="product-price">${esc(p.price || '')} <span style="font-size:.8em;font-weight:500">so'm</span></div>`;
      const altUz = p.alt_uz || p.name_uz || '';
      const altRu = p.alt_ru || p.name_ru || altUz;

      card.innerHTML = `
        <div class="product-image">
          <span class="cat-tag" data-uz="${esc(p.cat_short_uz || '')}" data-ru="${esc(p.cat_short_ru || p.cat_short_uz || '')}">${esc(currentLang === 'ru' ? (p.cat_short_ru || p.cat_short_uz) : p.cat_short_uz)}</span>
          ${badge}
          <img src="${esc(p.image_path || '')}" alt="${esc(currentLang === 'ru' ? altRu : altUz)}" data-uz="${esc(altUz)}" data-ru="${esc(altRu)}" width="600" height="750" loading="lazy" decoding="async" />
        </div>
        <div class="product-body">
          <div class="product-name" data-uz="${esc(p.name_uz || '')}" data-ru="${esc(p.name_ru || p.name_uz || '')}">${esc(currentLang === 'ru' ? (p.name_ru || p.name_uz) : p.name_uz)}</div>
          ${priceHtml}
          <div class="product-actions">
            <a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener" class="btn btn-primary"><i class="fa-brands fa-telegram" aria-hidden="true"></i><span data-uz="Buyurtma" data-ru="Заказать">Buyurtma</span></a>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  }
}

/* ============== RENDER: TESTIMONIALS ============== */
function renderTestimonials(items) {
  if (SITE) {
    const s = SITE.settings;
    setBi($('#testimonials .section-eyebrow'), s['testimonials.eyebrow_uz'], s['testimonials.eyebrow_ru']);
    setBi($('#testimonialsTitle'), s['testimonials.title_uz'], s['testimonials.title_ru']);
    setBi($('#testimonials .section-sub'), s['testimonials.subtitle_uz'], s['testimonials.subtitle_ru']);
  }

  const track = $('#testimonialTrack');
  if (!track) return;
  track.innerHTML = '';
  const list = items || [];
  const make = (t) => {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    const stars = '<i class="fa-solid fa-star"></i>'.repeat(t.stars || 5);
    card.innerHTML = `
      <i class="fa-solid fa-quote-right quote-icon" aria-hidden="true"></i>
      <div class="testimonial-stars" aria-label="${t.stars || 5} yulduz">${stars}</div>
      <p class="testimonial-text" data-uz="${esc(t.text_uz || '')}" data-ru="${esc(t.text_ru || t.text_uz || '')}">${esc(currentLang === 'ru' ? (t.text_ru || t.text_uz) : t.text_uz)}</p>
      <div class="testimonial-author">
        <div class="author-avatar" aria-hidden="true">${esc(t.author_initials || '')}</div>
        <div>
          <div class="author-name">${esc(t.author_name || '')}</div>
          <div class="author-meta" data-uz="${esc(t.city_uz || '')}" data-ru="${esc(t.city_ru || t.city_uz || '')}">${esc(currentLang === 'ru' ? (t.city_ru || t.city_uz) : t.city_uz)}</div>
        </div>
      </div>`;
    return card;
  };
  list.forEach(t => track.appendChild(make(t)));
}

const _animations = new WeakMap();
function startInfiniteScroll(el, duration) {
  if (_animations.has(el)) {
    try { _animations.get(el).cancel(); } catch (e) {}
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.style.animation = 'none';
  const anim = el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-50%)' },
    ],
    { duration, iterations: Infinity, easing: 'linear' }
  );
  _animations.set(el, anim);

  const parent = el.parentElement;
  if (parent && !parent.dataset.hoverBound) {
    parent.dataset.hoverBound = '1';
    parent.addEventListener('mouseenter', () => {
      const a = _animations.get(el);
      if (a) a.pause();
    });
    parent.addEventListener('mouseleave', () => {
      const a = _animations.get(el);
      if (a) a.play();
    });
  }
  return anim;
}

/* ============== RENDER: ORDER FORM ============== */
function renderOrderForm(categories) {
  if (SITE) {
    const s = SITE.settings;
    setBi($('#order .section-eyebrow'), s['order.eyebrow_uz'], s['order.eyebrow_ru']);
    setBi($('#orderTitle'), s['order.title_uz'], s['order.title_ru']);
    setBi($('#order .section-sub'), s['order.subtitle_uz'], s['order.subtitle_ru']);
  }

  const sel = $('#fCategory');
  if (!sel) return;
  $$('option:not([disabled])', sel).forEach(o => o.remove());
  (categories || []).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.slug;
    opt.dataset.uz = cat.name_uz;
    opt.dataset.ru = cat.name_ru || cat.name_uz;
    opt.textContent = currentLang === 'ru' ? (cat.name_ru || cat.name_uz) : cat.name_uz;
    sel.appendChild(opt);
  });
  const other = document.createElement('option');
  other.value = 'other';
  other.dataset.uz = 'Boshqa (individual buyurtma)';
  other.dataset.ru = 'Другое (индивидуальный заказ)';
  other.textContent = currentLang === 'ru' ? 'Другое (индивидуальный заказ)' : 'Boshqa (individual buyurtma)';
  sel.appendChild(other);
}

/* ============== RENDER: FOOTER & FLOATING ============== */
function renderFooter(s) {
  setBi($('.footer-tagline'), s['footer.tagline_uz'], s['footer.tagline_ru']);

  const phone = s['contacts.phone'] || '';
  const phoneDisplay = s['contacts.phone_display'] || phone;
  const tg = s['contacts.telegram_username'] || '';
  const ig = s['contacts.instagram_username'] || '';
  const wa = s['contacts.whatsapp'] || phone.replace(/\D/g, '');

  $$('a[href^="tel:"]').forEach(a => {
    a.setAttribute('href', 'tel:' + phone);
    a.textContent = phoneDisplay;
  });

  $$('a[href*="t.me/"]').forEach(a => {
    if (tg) a.setAttribute('href', 'https://t.me/' + tg);
    if (a.parentElement?.tagName === 'LI') a.textContent = 't.me/' + tg;
  });
  $$('a[href*="instagram.com/"]').forEach(a => {
    if (ig) a.setAttribute('href', 'https://instagram.com/' + ig);
    if (a.parentElement?.tagName === 'LI') a.textContent = '@' + ig;
  });

  const waLink = $('.float-wa');
  if (waLink && wa) waLink.setAttribute('href', `https://wa.me/${wa}?text=${encodeURIComponent('Assalomu alaykum! Buyurtma bermoqchiman.')}`);
  $$('a[href*="wa.me/"]').forEach(a => {
    if (wa) a.setAttribute('href', 'https://wa.me/' + wa);
  });

  const yearEl = $('#copyrightYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const span = $('.footer-bottom span:last-child');
  setBi(span, s['footer.copyright_text_uz'], s['footer.copyright_text_ru']);
}

/* ============== LANGUAGE ============== */
function applyLanguage(lang) {
  if (lang !== 'uz' && lang !== 'ru') lang = 'uz';
  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('xfh_lang', lang);

  $$('[data-uz][data-ru]').forEach(el => {
    const txt = el.getAttribute('data-' + lang);
    if (txt !== null) {
      if (el.tagName === 'IMG') el.alt = txt;
      else el.textContent = txt;
    }
  });
  $$('.lang-btn').forEach(b => {
    const active = b.dataset.lang === lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });

  if (SITE) renderHead(SITE.settings);
}

function initLangToggle() {
  $$('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
}

/* ============== NAVBAR ============== */
function initNavbar() {
  const navbar = $('#navbar');
  const backToTop = $('#backToTop');
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.querySelector('i').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.querySelector('i').className = 'fa-solid fa-bars';
    }));
  }
}

/* ============== FILTER ============== */
function initFilter() {
  const tabs = $$('.filter-tab');
  const cards = $$('.product-card');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const f = tab.dataset.filter;
      cards.forEach(card => card.classList.toggle('hide', !(f === 'all' || card.dataset.cat === f)));
    });
  });
}

/* ============== HERO SLIDER ============== */
function initSlider() {
  const slider = $('#heroSlider');
  if (!slider) return;
  const slides = $$('.slide', slider);
  const dots = $$('.slider-dot', slider);
  const prevBtn = slider.querySelector('.slider-nav.prev');
  const nextBtn = slider.querySelector('.slider-nav.next');
  if (!slides.length) return;
  let cur = 0, auto;

  function go(n) {
    slides[cur].classList.remove('active');
    dots[cur]?.classList.remove('active');
    dots[cur]?.setAttribute('aria-selected', 'false');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
    dots[cur]?.classList.add('active');
    dots[cur]?.setAttribute('aria-selected', 'true');
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function start() { if (!reduceMotion && slides.length > 1) auto = setInterval(() => go(cur + 1), 4000); }
  function stop() { clearInterval(auto); }
  prevBtn?.addEventListener('click', () => { stop(); go(cur - 1); start(); });
  nextBtn?.addEventListener('click', () => { stop(); go(cur + 1); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { stop(); go(i); start(); }));
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  start();
}

/* ============== LIGHTBOX ============== */
function initLightbox() {
  const overlay = $('#galleryOverlay');
  if (!overlay) return;
  const overlayImg = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.gallery-close');
  $$('.product-image img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      overlayImg.src = img.src;
      overlayImg.alt = img.alt;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  function close() { overlay.classList.remove('active'); document.body.style.overflow = ''; }
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ============== REVEAL OBSERVER ============== */
function initRevealObserver() {
  const els = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  els.forEach(el => io.observe(el));
}

/* ============== COUNTERS ============== */
function initCounters() {
  const nums = $$('.stat-num');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.closest('.stat')?.classList.add('in-view');
        const el = e.target;
        const text = el.textContent;
        const num = parseInt(text.replace(/\D/g, ''), 10);
        if (!num) return;
        const suffix = text.replace(/[\d]/g, '');
        let start = 0;
        const step = Math.max(1, Math.floor(num / 60));
        const t = setInterval(() => {
          start += step;
          if (start >= num) { start = num; clearInterval(t); }
          el.textContent = start + suffix;
        }, 25);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(el => io.observe(el));
}

/* ============== PARTICLES ============== */
function initParticles() {
  const container = $('.particles');
  if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 12 + 4;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:particleFloat ${Math.random()*6+4}s ease-in-out infinite ${Math.random()*3}s`;
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes particleFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-30px) rotate(180deg)}}';
  document.head.appendChild(style);
}

/* ============== TOAST ============== */
function showToast(message, type = 'success') {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast ' + type + ' visible';
  setTimeout(() => toast.classList.remove('visible'), 4000);
}

/* ============== ORDER FORM ============== */
function formatUzPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  if (digits.length > 9) digits = digits.slice(0, 9);
  let out = '+998';
  if (digits.length > 0) out += ' ' + digits.slice(0, 2);
  if (digits.length > 2) out += ' ' + digits.slice(2, 5);
  if (digits.length > 5) out += ' ' + digits.slice(5, 7);
  if (digits.length > 7) out += ' ' + digits.slice(7, 9);
  return out;
}

function initOrderForm() {
  const form = $('#orderForm');
  if (!form) return;
  const fName = $('#fName');
  const fPhone = $('#fPhone');
  const fCategory = $('#fCategory');
  const fNote = $('#fNote');
  const fWebsite = $('#fWebsite');
  const submitBtn = $('#formSubmit');

  fPhone.addEventListener('input', (e) => {
    const c = e.target.selectionStart;
    const o = e.target.value.length;
    e.target.value = formatUzPhone(e.target.value);
    const n = e.target.value.length;
    e.target.setSelectionRange(c + (n - o), c + (n - o));
  });
  fPhone.addEventListener('focus', () => { if (!fPhone.value) fPhone.value = '+998 '; });

  function clearErrors() {
    $$('.form-field').forEach(f => {
      f.classList.remove('error');
      const inp = f.querySelector('input, select, textarea');
      inp && inp.setAttribute('aria-invalid', 'false');
    });
  }
  function setErr(inp) { inp.closest('.form-field').classList.add('error'); inp.setAttribute('aria-invalid', 'true'); }

  [fName, fPhone, fCategory].forEach(el => ['input', 'change'].forEach(ev =>
    el.addEventListener(ev, () => { el.closest('.form-field').classList.remove('error'); el.setAttribute('aria-invalid', 'false'); })
  ));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    if (fWebsite && fWebsite.value) return;
    const name = fName.value.trim();
    const phone = fPhone.value.trim();
    const note = (fNote.value || '').trim();
    let bad = false;
    if (!name || name.length < 2) { setErr(fName); bad = true; }
    if (!phone || !/^\+?[\d\s\-]{9,}$/.test(phone)) { setErr(fPhone); bad = true; }
    if (!fCategory.value) { setErr(fCategory); bad = true; }
    if (bad) {
      showToast(currentLang === 'uz' ? 'Iltimos, maydonlarni to\'g\'ri to\'ldiring' : 'Пожалуйста, заполните поля корректно', 'error');
      return;
    }
    const catText = fCategory.options[fCategory.selectedIndex].getAttribute('data-' + currentLang) || fCategory.value;

    submitBtn.disabled = true;
    const orig = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${currentLang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'}</span>`;

    try {
      const r = await postOrder({ name, phone, category: catText, note });
      if (r.ok) {
        showToast(currentLang === 'uz' ? '✓ Buyurtma yuborildi! Tez orada bog\'lanamiz.' : '✓ Заказ отправлен! Скоро свяжемся.', 'success');
        form.reset();
      } else {
        throw new Error(r.error || 'Xato');
      }
    } catch (err) {
      console.error(err);
      showToast(currentLang === 'uz' ? 'Xato! Telegram tugmasi orqali bog\'laning.' : 'Ошибка! Свяжитесь через Telegram.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = orig;
    }
  });
}

/* ============== PRELOADER ============== */
function hidePreloader() {
  const p = $('#preloader');
  if (!p) return;
  setTimeout(() => p.classList.add('hidden'), 200);
  setTimeout(() => p.remove(), 700);
}

/* ============== BOOT ============== */
async function boot() {
  try {
    SITE = await fetchSite();
  } catch (e) {
    console.error('Site data load failed:', e);
    SITE = { settings: {}, heroSlides: [], marquee: [], categories: [], products: [], testimonials: [] };
    showToast('Sayt ma\'lumotlari yuklanmadi', 'error');
  }
  renderHead(SITE.settings);
  renderBrand(SITE.settings);
  renderHero(SITE);
  renderMarquee(SITE.marquee);
  renderAbout(SITE.settings);
  renderCatalog(SITE);
  renderTestimonials(SITE.testimonials);
  renderOrderForm(SITE.categories);
  renderFooter(SITE.settings);

  applyLanguage(currentLang);

  initLangToggle();
  initNavbar();
  initFilter();
  initSlider();
  initLightbox();
  initRevealObserver();
  initCounters();
  initParticles();
  initOrderForm();

  hidePreloader();
}

document.addEventListener('DOMContentLoaded', boot);
