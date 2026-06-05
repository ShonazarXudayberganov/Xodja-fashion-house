/* ============== AUTH ============== */
const TOKEN = localStorage.getItem('xfh_admin_token');
if (!TOKEN) location.href = 'login.html';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const jp = (o) => JSON.stringify(o).replace(/'/g, '&#39;').replace(/&(?!#?\w+;)/g, '&amp;');
const imgSrc = (p) => {
  if (!p) return '';
  return /^https?:\/\//i.test(p) || p.startsWith('/') ? p : '/' + p;
};

/* ============== API ============== */
async function api(method, path, body, isFormData = false) {
  const opts = {
    method,
    headers: { Authorization: 'Bearer ' + TOKEN },
  };
  if (body != null) {
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(path, opts);
  if (res.status === 401) { localStorage.removeItem('xfh_admin_token'); location.href = 'login.html'; return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
  return data;
}

/* ============== TOAST ============== */
function toast(msg, type = 'success') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' visible';
  setTimeout(() => t.classList.remove('visible'), 3500);
}

/* ============== MODAL ============== */
let modalSaveCb = null;
function openModal(title, bodyHtml, onSave) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  modalSaveCb = onSave;
  $('#modal').classList.add('active');
}
function closeModal() {
  $('#modal').classList.remove('active');
  modalSaveCb = null;
}
$('#modalSave').addEventListener('click', async (e) => {
  if (!modalSaveCb) return;
  const btn = e.currentTarget;
  if (btn.disabled) return;
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-inline"></span> Saqlanmoqda...';
  try { await modalSaveCb(); }
  catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = orig; }
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('active')) closeModal(); });

/* ============== ROUTING ============== */
const VIEWS = {
  dashboard: { title: 'Dashboard', sub: 'Saytning umumiy holatini kuzating', load: loadDashboard },
  brand: { title: 'Brand & Kontakt', sub: 'Brand nomi va aloqa ma\'lumotlari', load: loadBrand },
  seo: { title: 'SEO / Meta', sub: 'Qidiruv tizimlari va ijtimoiy tarmoqlar uchun', load: loadSEO },
  hero: { title: 'Hero bo\'limi', sub: 'Bosh sahifaning yuqori qismi', load: loadHero },
  about: { title: 'About bo\'limi', sub: 'Biz haqimizda bo\'limi va boshqa sarlavhalar', load: loadAbout },
  marquee: { title: 'Marquee', sub: 'Lentadagi yozuvlar', load: loadMarquee },
  categories: { title: 'Kategoriyalar', sub: 'Mahsulot kategoriyalari', load: loadCategories },
  products: { title: 'Mahsulotlar', sub: 'Katalog mahsulotlari', load: loadProducts },
  testimonials: { title: 'Sharhlar', sub: 'Mijoz sharhlari', load: loadTestimonials },
  contact: { title: 'Manzil & Xarita', sub: 'Bog\'lanish bo\'limi va Yandex xarita', load: loadContact },
  orders: { title: 'Buyurtmalar', sub: 'Saytdan kelgan zakazlar', load: loadOrders },
  account: { title: 'Sozlamalar', sub: 'Parol va boshqa', load: () => {} },
};

function setView(name) {
  if (!VIEWS[name]) name = 'dashboard';
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  $$('#sidebarNav a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  $('#viewTitle').textContent = VIEWS[name].title;
  $('#viewSubtitle').textContent = VIEWS[name].sub;
  VIEWS[name].load();
  $('#sidebar').classList.remove('open');
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => setView((location.hash || '#dashboard').slice(1)));

/* ============== MOBILE MENU ============== */
$('#mobileMenuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

/* ============== LOGOUT ============== */
$('#logoutBtn').addEventListener('click', e => {
  e.preventDefault();
  if (!confirm('Chiqishni tasdiqlaysizmi?')) return;
  localStorage.removeItem('xfh_admin_token');
  localStorage.removeItem('xfh_admin_user');
  location.href = 'login.html';
});

/* ============== HELPERS: FILL/READ FORM ============== */
function fillForm(form, data) {
  $$('input, select, textarea', form).forEach(el => {
    const name = el.getAttribute('name');
    if (name && data[name] != null) {
      if (el.type === 'checkbox') el.checked = !!data[name];
      else el.value = data[name];
    }
  });
}
function readForm(form) {
  const out = {};
  $$('input, select, textarea', form).forEach(el => {
    const name = el.getAttribute('name');
    if (!name) return;
    if (el.type === 'checkbox') out[name] = el.checked ? 1 : 0;
    else out[name] = el.value;
  });
  return out;
}

/* ============== SETTINGS LOADERS ============== */
let SETTINGS_CACHE = null;
async function loadSettings(force) {
  if (!SETTINGS_CACHE || force) SETTINGS_CACHE = await api('GET', '/api/admin/settings');
  return SETTINGS_CACHE;
}
async function saveSettingsForm(form, btn) {
  const data = readForm(form);
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-inline"></span> Saqlanmoqda...';
  try {
    await api('PUT', '/api/admin/settings', data);
    SETTINGS_CACHE = null;
    toast('✓ Saqlandi');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function bindSettingsForm(formId) {
  const form = $('#' + formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    saveSettingsForm(form, form.querySelector('button[type=submit]'));
  });
}
bindSettingsForm('brandForm');
bindSettingsForm('contactsForm');
bindSettingsForm('seoForm');
bindSettingsForm('heroForm');
bindSettingsForm('aboutForm');
bindSettingsForm('sectionsForm');
bindSettingsForm('contactForm');

async function loadContact() {
  const s = await loadSettings();
  fillForm($('#contactForm'), s);
}

/* ============== DASHBOARD ============== */
async function loadDashboard() {
  try {
    const [products, slides, testimonials, orders] = await Promise.all([
      api('GET', '/api/admin/products'),
      api('GET', '/api/admin/hero_slides'),
      api('GET', '/api/admin/testimonials'),
      api('GET', '/api/admin/orders?limit=500'),
    ]);
    $('#statProducts').textContent = products.length;
    $('#statSlides').textContent = slides.length;
    $('#statTestimonials').textContent = testimonials.length;
    $('#statOrders').textContent = orders.length;

    const recent = $('#recentOrders');
    if (orders.length === 0) {
      recent.innerHTML = '<div class="empty"><i class="fa-solid fa-inbox"></i>Hozircha buyurtmalar yo\'q</div>';
    } else {
      recent.innerHTML = `
        <table style="margin-top:8px;">
          <thead><tr><th>Sana</th><th>Ism</th><th>Telefon</th><th>Kategoriya</th><th>Holat</th></tr></thead>
          <tbody>${orders.slice(0, 5).map(o => `
            <tr>
              <td>${formatDate(o.created_at)}</td>
              <td>${esc(o.name)}</td>
              <td>${esc(o.phone)}</td>
              <td>${esc(o.category || '—')}</td>
              <td><span class="badge b-status-${esc(o.status)}">${statusLabel(o.status)}</span></td>
            </tr>`).join('')}</tbody>
        </table>`;
    }
  } catch (e) {
    toast(e.message, 'error');
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function statusLabel(s) {
  return ({ new: 'Yangi', contacted: 'Bog\'lanildi', completed: 'Tugatildi', cancelled: 'Bekor qilindi' })[s] || s;
}

/* ============== BRAND / CONTACTS ============== */
async function loadBrand() {
  const s = await loadSettings();
  fillForm($('#brandForm'), s);
  fillForm($('#contactsForm'), s);
  updateBotStatus(s);
}

function updateBotStatus(s) {
  const el = $('#botStatus');
  if (!el) return;
  const hasToken = s['contacts.bot_token'] && s['contacts.bot_token'].length > 10;
  const hasChat = s['contacts.bot_chat_id'] && s['contacts.bot_chat_id'].length > 0;
  if (!hasToken && !hasChat) {
    el.innerHTML = `<div style="background:rgba(255,152,0,0.08);border:1px solid rgba(255,152,0,0.3);border-radius:8px;padding:10px 14px;font-size:0.88rem;color:#e65100;"><i class="fa-solid fa-circle-info"></i> <b>Bot sozlanmagan.</b> Forma yuborilganda foydalanuvchi qo'lda Telegram'ga link orqali yuboradi.</div>`;
  } else if (hasToken && hasChat) {
    el.innerHTML = `<div style="background:rgba(0,200,83,0.08);border:1px solid rgba(0,200,83,0.3);border-radius:8px;padding:10px 14px;font-size:0.88rem;color:#00792e;"><i class="fa-solid fa-circle-check"></i> <b>Bot sozlangan.</b> Tekshirish tugmasini bosib ulanishni sinab ko'ring.</div>`;
  } else {
    el.innerHTML = `<div style="background:rgba(229,57,53,0.08);border:1px solid rgba(229,57,53,0.3);border-radius:8px;padding:10px 14px;font-size:0.88rem;color:#c62828;"><i class="fa-solid fa-triangle-exclamation"></i> <b>Yarim sozlangan.</b> Token ham, Chat ID ham kerak.</div>`;
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.closest && e.target.closest('#testBotBtn')) {
    const btn = e.target.closest('#testBotBtn');
    const tokenInput = document.querySelector('input[name="contacts.bot_token"]');
    const chatInput = document.querySelector('input[name="contacts.bot_chat_id"]');
    if (!tokenInput.value.trim() || !chatInput.value.trim()) {
      toast('Avval Token va Chat ID ni kiriting', 'error');
      return;
    }
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Tekshirilmoqda...';
    try {
      const r = await api('POST', '/api/admin/test-bot', {
        token: tokenInput.value.trim(),
        chat_id: chatInput.value.trim(),
      });
      toast('✓ ' + r.message, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }
});

/* ============== SEO ============== */
async function loadSEO() {
  const s = await loadSettings();
  fillForm($('#seoForm'), s);
}

/* ============== HERO ============== */
async function loadHero() {
  const s = await loadSettings();
  fillForm($('#heroForm'), s);
  await renderSlides();
}

async function renderSlides() {
  const tbody = $('#slidesTbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const list = await api('GET', '/api/admin/hero_slides');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty"><i class="fa-solid fa-image"></i>Slaydlar yo\'q</div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td><img class="thumb" src="${esc(imgSrc(s.image_path))}" alt="" /></td>
      <td>${esc(s.alt_uz || '')}</td>
      <td>${esc(s.alt_ru || '')}</td>
      <td>${s.sort_order}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-outline" onclick='openSlideEditor(${jp(s)})'><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('hero_slides',${s.id},renderSlides)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.openSlideEditor = function(slide = {}) {
  openModal(slide.id ? 'Slaydni tahrirlash' : 'Yangi slayd', `
    <div class="form-row cols-1">
      <div class="field">
        <label>Rasm</label>
        <div id="slideImgPreview" style="margin-bottom:8px;">
          ${slide.image_path ? `<img class="img-preview" src="${esc(imgSrc(slide.image_path))}" />` : ''}
        </div>
        <div class="row-flex">
          <input id="slideImagePath" value="${esc(slide.image_path || '')}" placeholder="images/example.jpg" style="flex:1;" />
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('slideImageFile').click()"><i class="fa-solid fa-upload"></i> Yuklash</button>
          <input type="file" id="slideImageFile" accept="image/*" style="display:none;" onchange="uploadModalImage(this,'slideImagePath','slideImgPreview')" />
        </div>
      </div>
      <div class="field"><label>Alt UZ</label><input id="slideAltUz" value="${esc(slide.alt_uz || '')}" /></div>
      <div class="field"><label>Alt RU</label><input id="slideAltRu" value="${esc(slide.alt_ru || '')}" /></div>
      <div class="field"><label>Tartib raqami</label><input id="slideSort" type="number" value="${slide.sort_order || 0}" /></div>
    </div>`,
    async () => {
      const body = {
        image_path: $('#slideImagePath').value,
        alt_uz: $('#slideAltUz').value,
        alt_ru: $('#slideAltRu').value,
        sort_order: parseInt($('#slideSort').value) || 0,
      };
      if (!body.image_path) throw new Error('Rasm kerak');
      if (slide.id) await api('PUT', `/api/admin/hero_slides/${slide.id}`, body);
      else await api('POST', '/api/admin/hero_slides', body);
      closeModal();
      toast('✓ Saqlandi');
      renderSlides();
    });
};

/* ============== ABOUT (with image upload) ============== */
async function loadAbout() {
  const s = await loadSettings();
  fillForm($('#aboutForm'), s);
  fillForm($('#sectionsForm'), s);
}
$('#aboutImageFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  try {
    const r = await api('POST', '/api/admin/upload', fd, true);
    $('#aboutImagePath').value = r.path;
    toast('✓ Yuklandi');
  } catch (err) { toast(err.message, 'error'); }
});

window.uploadModalImage = async function(input, targetId, previewId) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  try {
    const r = await api('POST', '/api/admin/upload', fd, true);
    $('#' + targetId).value = r.path;
    if (previewId) $('#' + previewId).innerHTML = `<img class="img-preview" src="${esc(imgSrc(r.path))}" />`;
    toast('✓ Yuklandi');
  } catch (err) { toast(err.message, 'error'); }
};

/* ============== MARQUEE ============== */
async function loadMarquee() {
  const tbody = $('#marqueeTbody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const list = await api('GET', '/api/admin/marquee_items');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty"><i class="fa-solid fa-bars-staggered"></i>Yozuvlar yo\'q</div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(m => `
    <tr>
      <td>${esc(m.text_uz)}</td>
      <td>${esc(m.text_ru || '')}</td>
      <td>${m.sort_order}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-outline" onclick='openMarqueeEditor(${jp(m)})'><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('marquee_items',${m.id},loadMarquee)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.openMarqueeEditor = function(m = {}) {
  openModal(m.id ? 'Yozuvni tahrirlash' : 'Yangi yozuv', `
    <div class="form-row cols-1">
      <div class="field"><label>Matn UZ</label><input id="mqUz" value="${esc(m.text_uz || '')}" /></div>
      <div class="field"><label>Matn RU</label><input id="mqRu" value="${esc(m.text_ru || '')}" /></div>
      <div class="field"><label>Tartib</label><input id="mqSort" type="number" value="${m.sort_order || 0}" /></div>
    </div>`,
    async () => {
      const body = { text_uz: $('#mqUz').value, text_ru: $('#mqRu').value, sort_order: parseInt($('#mqSort').value) || 0 };
      if (!body.text_uz) throw new Error('UZ matn kerak');
      if (m.id) await api('PUT', `/api/admin/marquee_items/${m.id}`, body);
      else await api('POST', '/api/admin/marquee_items', body);
      closeModal();
      toast('✓ Saqlandi');
      loadMarquee();
    });
};

/* ============== CATEGORIES ============== */
async function loadCategories() {
  const tbody = $('#categoriesTbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const list = await api('GET', '/api/admin/categories');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><i class="fa-solid fa-tags"></i>Kategoriyalar yo\'q</div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><code style="background:var(--pink-soft);padding:2px 6px;border-radius:4px;">${esc(c.slug)}</code></td>
      <td>${esc(c.name_uz)}</td>
      <td>${esc(c.name_ru || '')}</td>
      <td>${esc(c.short_uz || '')}</td>
      <td>${esc(c.short_ru || '')}</td>
      <td>${c.sort_order}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-outline" onclick='openCategoryEditor(${jp(c)})'><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('categories',${c.id},loadCategories)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.openCategoryEditor = function(c = {}) {
  openModal(c.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya', `
    <div class="form-row">
      <div class="field full"><label>Slug (lotin, lower-case, ${c.id ? 'o\'zgartirmang' : 'masalan: evening'})</label><input id="catSlug" value="${esc(c.slug || '')}" /></div>
      <div class="field"><label>To'liq nomi UZ</label><input id="catNameUz" value="${esc(c.name_uz || '')}" /></div>
      <div class="field"><label>To'liq nomi RU</label><input id="catNameRu" value="${esc(c.name_ru || '')}" /></div>
      <div class="field"><label>Qisqa nomi UZ (kartochkadagi tag)</label><input id="catShortUz" value="${esc(c.short_uz || '')}" /></div>
      <div class="field"><label>Qisqa nomi RU</label><input id="catShortRu" value="${esc(c.short_ru || '')}" /></div>
      <div class="field full"><label>Tartib raqami</label><input id="catSort" type="number" value="${c.sort_order || 0}" /></div>
    </div>`,
    async () => {
      const body = {
        slug: $('#catSlug').value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        name_uz: $('#catNameUz').value,
        name_ru: $('#catNameRu').value,
        short_uz: $('#catShortUz').value,
        short_ru: $('#catShortRu').value,
        sort_order: parseInt($('#catSort').value) || 0,
      };
      if (!body.slug || !body.name_uz) throw new Error('Slug va UZ nom kerak');
      if (c.id) await api('PUT', `/api/admin/categories/${c.id}`, body);
      else await api('POST', '/api/admin/categories', body);
      closeModal();
      toast('✓ Saqlandi');
      loadCategories();
    });
};

/* ============== PRODUCTS ============== */
let CATEGORIES_CACHE = null;
async function loadProducts() {
  CATEGORIES_CACHE = await api('GET', '/api/admin/categories');
  const tbody = $('#productsTbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const list = await api('GET', '/api/admin/products');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><i class="fa-solid fa-shirt"></i>Mahsulotlar yo\'q</div></td></tr>';
    return;
  }
  const catMap = {};
  CATEGORIES_CACHE.forEach(c => catMap[c.id] = c.name_uz);
  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.image_path ? `<img class="thumb" src="${esc(imgSrc(p.image_path))}" />` : '—'}</td>
      <td>${esc(p.name_uz)}</td>
      <td>${esc(catMap[p.category_id] || '—')}</td>
      <td>${p.price_ask ? '<i class="muted">So\'rang</i>' : esc(p.price || '—')}</td>
      <td>${p.badge_type ? `<span class="badge b-${esc(p.badge_type)}">${esc(p.badge_text || p.badge_type)}</span>` : '—'}</td>
      <td>${p.visible ? '<i class="fa-solid fa-eye" style="color:#00c853;"></i>' : '<i class="fa-solid fa-eye-slash muted"></i>'}</td>
      <td>${p.sort_order}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-outline" onclick='openProductEditor(${jp(p)})'><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('products',${p.id},loadProducts)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.openProductEditor = function(p = {}) {
  const cats = CATEGORIES_CACHE || [];
  const catOptions = ['<option value="">— tanlang —</option>']
    .concat(cats.map(c => `<option value="${c.id}" ${p.category_id == c.id ? 'selected' : ''}>${esc(c.name_uz)}</option>`))
    .join('');
  const badgeTypes = [['', '— yo\'q —'], ['top', '⭐ Top'], ['new', 'Yangi'], ['sale', 'Sale']];
  const badgeOptions = badgeTypes.map(([v, l]) => `<option value="${v}" ${p.badge_type === v || (!p.badge_type && v === '') ? 'selected' : ''}>${esc(l)}</option>`).join('');

  openModal(p.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot', `
    <div class="form-row">
      <div class="field full">
        <label>Rasm</label>
        <div id="prodImgPreview" style="margin-bottom:8px;">${p.image_path ? `<img class="img-preview" src="${esc(imgSrc(p.image_path))}" />` : ''}</div>
        <div class="row-flex">
          <input id="prodImagePath" value="${esc(p.image_path || '')}" placeholder="images/..." style="flex:1;" />
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('prodImageFile').click()"><i class="fa-solid fa-upload"></i> Yuklash</button>
          <input type="file" id="prodImageFile" accept="image/*" style="display:none;" onchange="uploadModalImage(this,'prodImagePath','prodImgPreview')" />
        </div>
      </div>
      <div class="field full"><label>Kategoriya</label><select id="prodCat">${catOptions}</select></div>
      <div class="field"><label>Nom UZ</label><input id="prodNameUz" value="${esc(p.name_uz || '')}" /></div>
      <div class="field"><label>Nom RU</label><input id="prodNameRu" value="${esc(p.name_ru || '')}" /></div>
      <div class="field"><label>Alt UZ</label><input id="prodAltUz" value="${esc(p.alt_uz || '')}" /></div>
      <div class="field"><label>Alt RU</label><input id="prodAltRu" value="${esc(p.alt_ru || '')}" /></div>
      <div class="field"><label>Narx (matn, masalan: 1 250 000)</label><input id="prodPrice" value="${esc(p.price || '')}" /></div>
      <div class="field" style="display:flex;flex-direction:column;justify-content:flex-end;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;letter-spacing:0;">
          <input type="checkbox" id="prodPriceAsk" ${p.price_ask ? 'checked' : ''} style="width:auto;" /> Narx so'rash (yashirin)
        </label>
      </div>
      <div class="field"><label>Badge tur</label><select id="prodBadgeType">${badgeOptions}</select></div>
      <div class="field"><label>Badge matn (masalan: -20%)</label><input id="prodBadgeText" value="${esc(p.badge_text || '')}" /></div>
      <div class="field" style="display:flex;flex-direction:column;justify-content:flex-end;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;letter-spacing:0;">
          <input type="checkbox" id="prodVisible" ${p.visible !== 0 ? 'checked' : ''} style="width:auto;" /> Saytda ko'rinsin
        </label>
      </div>
      <div class="field"><label>Tartib raqami</label><input id="prodSort" type="number" value="${p.sort_order || 0}" /></div>
    </div>`,
    async () => {
      const body = {
        category_id: parseInt($('#prodCat').value) || null,
        name_uz: $('#prodNameUz').value,
        name_ru: $('#prodNameRu').value,
        alt_uz: $('#prodAltUz').value,
        alt_ru: $('#prodAltRu').value,
        image_path: $('#prodImagePath').value,
        price: $('#prodPrice').value,
        price_ask: $('#prodPriceAsk').checked ? 1 : 0,
        badge_type: $('#prodBadgeType').value || null,
        badge_text: $('#prodBadgeText').value || null,
        visible: $('#prodVisible').checked ? 1 : 0,
        sort_order: parseInt($('#prodSort').value) || 0,
      };
      if (!body.name_uz) throw new Error('UZ nom kerak');
      if (p.id) await api('PUT', `/api/admin/products/${p.id}`, body);
      else await api('POST', '/api/admin/products', body);
      closeModal();
      toast('✓ Saqlandi');
      loadProducts();
    });
};

/* ============== TESTIMONIALS ============== */
async function loadTestimonials() {
  const tbody = $('#testimonialsTbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const list = await api('GET', '/api/admin/testimonials');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><i class="fa-solid fa-comments"></i>Sharhlar yo\'q</div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(t => `
    <tr>
      <td><b>${esc(t.author_name)}</b><br><small class="muted">${esc(t.author_initials || '')}</small></td>
      <td>${esc(t.city_uz || '')}</td>
      <td>${'★'.repeat(t.stars || 5)}</td>
      <td style="max-width:300px;">${esc(t.text_uz)}</td>
      <td>${t.sort_order}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-outline" onclick='openTestimonialEditor(${jp(t)})'><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('testimonials',${t.id},loadTestimonials)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.openTestimonialEditor = function(t = {}) {
  openModal(t.id ? 'Sharhni tahrirlash' : 'Yangi sharh', `
    <div class="form-row">
      <div class="field"><label>Mijoz ismi (Malika S.)</label><input id="tName" value="${esc(t.author_name || '')}" /></div>
      <div class="field"><label>Bosh harflar (MS)</label><input id="tInit" value="${esc(t.author_initials || '')}" maxlength="3" /></div>
      <div class="field"><label>Shahar UZ</label><input id="tCityUz" value="${esc(t.city_uz || '')}" /></div>
      <div class="field"><label>Shahar RU</label><input id="tCityRu" value="${esc(t.city_ru || '')}" /></div>
      <div class="field full"><label>Sharh matni UZ</label><textarea id="tTextUz" rows="3">${esc(t.text_uz || '')}</textarea></div>
      <div class="field full"><label>Sharh matni RU</label><textarea id="tTextRu" rows="3">${esc(t.text_ru || '')}</textarea></div>
      <div class="field"><label>Yulduzlar (1-5)</label><input id="tStars" type="number" min="1" max="5" value="${t.stars || 5}" /></div>
      <div class="field"><label>Tartib</label><input id="tSort" type="number" value="${t.sort_order || 0}" /></div>
    </div>`,
    async () => {
      const body = {
        author_name: $('#tName').value,
        author_initials: $('#tInit').value,
        city_uz: $('#tCityUz').value,
        city_ru: $('#tCityRu').value,
        text_uz: $('#tTextUz').value,
        text_ru: $('#tTextRu').value,
        stars: parseInt($('#tStars').value) || 5,
        sort_order: parseInt($('#tSort').value) || 0,
      };
      if (!body.author_name || !body.text_uz) throw new Error('Ism va UZ matn kerak');
      if (t.id) await api('PUT', `/api/admin/testimonials/${t.id}`, body);
      else await api('POST', '/api/admin/testimonials', body);
      closeModal();
      toast('✓ Saqlandi');
      loadTestimonials();
    });
};

/* ============== ORDERS ============== */
$('#orderFilter').addEventListener('change', loadOrders);

async function loadOrders() {
  const tbody = $('#ordersTbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;"><span class="spinner-inline"></span></td></tr>';
  const status = $('#orderFilter').value;
  const url = '/api/admin/orders' + (status ? '?status=' + status : '');
  const list = await api('GET', url);
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><i class="fa-solid fa-bag-shopping"></i>Buyurtmalar yo\'q</div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${formatDate(o.created_at)}</td>
      <td><b>${esc(o.name)}</b></td>
      <td><a href="tel:${esc(o.phone)}" style="color:var(--pink);font-weight:600;">${esc(o.phone)}</a></td>
      <td>${esc(o.category || '—')}</td>
      <td style="max-width:200px;">${esc(o.note || '—')}</td>
      <td>
        <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:0.82rem;">
          ${['new','contacted','completed','cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
        </select>
      </td>
      <td class="row-actions">
        <a href="https://t.me/share/url?url=&text=${encodeURIComponent('Salom! Buyurtmangiz haqida')}" class="btn btn-sm btn-outline" title="Telegram"><i class="fa-brands fa-telegram"></i></a>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('orders',${o.id},loadOrders)"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

window.updateOrderStatus = async function(id, status) {
  try {
    await api('PUT', `/api/admin/orders/${id}`, { status });
    toast('✓ Holat yangilandi');
  } catch (e) { toast(e.message, 'error'); }
};

/* ============== DELETE ============== */
window.deleteItem = async function(table, id, reload) {
  if (!confirm('Haqiqatan o\'chirmoqchimisiz?')) return;
  try {
    await api('DELETE', `/api/admin/${table}/${id}`);
    toast('✓ O\'chirildi');
    reload();
  } catch (e) { toast(e.message, 'error'); }
};

/* ============== ACCOUNT (CHANGE PASSWORD) ============== */
$('#passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const data = readForm(f);
  if (data.new_password !== data.new_password_confirm) {
    toast('Yangi parollar mos emas', 'error');
    return;
  }
  if (data.new_password.length < 6) {
    toast('Parol kamida 6 ta belgi bo\'lsin', 'error');
    return;
  }
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api('POST', '/api/admin/change-password', { current_password: data.current_password, new_password: data.new_password });
    toast('✓ Parol o\'zgartirildi');
    f.reset();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

/* ============== INIT ============== */
setView((location.hash || '#dashboard').slice(1));
