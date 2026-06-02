const fs = require('fs/promises');
const path = require('path');
const { makeDefaultData, normalizeData } = require('./defaultData');

const DATA_KEY = process.env.XFH_DATA_KEY || 'site-data.json';
const DATA_FILE = process.env.XFH_DATA_FILE || path.join(__dirname, 'data.json');
const TABLES = ['hero_slides', 'marquee_items', 'categories', 'products', 'testimonials', 'orders', 'admin_users'];
const SORTABLE_TABLES = new Set(['hero_slides', 'marquee_items', 'categories', 'products', 'testimonials']);
let localQueue = Promise.resolve();

function useBlobs() {
  if (process.env.XFH_STORAGE === 'json') return false;
  if (process.env.XFH_STORAGE === 'blobs') return true;
  return process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

async function getStore(name) {
  const mod = await import('@netlify/blobs');
  return mod.getStore(name);
}

async function getDataBlobStore() {
  return getStore(process.env.XFH_BLOBS_DATA_STORE || 'xfh-data');
}

async function readLocalData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return normalizeData(JSON.parse(raw));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    const data = makeDefaultData();
    await writeLocalData(data);
    return data;
  }
}

async function writeLocalData(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalizeData(data), null, 2) + '\n');
}

async function readBlobEntry() {
  const store = await getDataBlobStore();
  const entry = await store.getWithMetadata(DATA_KEY, { type: 'json', consistency: 'strong' });
  if (!entry) return { data: makeDefaultData(), etag: null };
  return { data: normalizeData(entry.data), etag: entry.etag };
}

function isWriteConflict(err) {
  const msg = String(err && (err.message || err.name || err.code || ''));
  return err && (err.status === 412 || err.statusCode === 412 || err.code === 412 || /precondition|etag|onlyIf/i.test(msg));
}

async function writeBlobData(store, data, etag) {
  const options = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
  await store.setJSON(DATA_KEY, normalizeData(data), options);
}

async function loadData() {
  if (!useBlobs()) return readLocalData();
  const { data } = await readBlobEntry();
  if (!data.admin_users.length) {
    data.admin_users = makeDefaultData().admin_users;
  }
  return normalizeData(data);
}

async function saveData(data) {
  if (!useBlobs()) {
    await writeLocalData(data);
    return normalizeData(data);
  }
  const store = await getDataBlobStore();
  await store.setJSON(DATA_KEY, normalizeData(data));
  return normalizeData(data);
}

async function updateData(mutator) {
  if (!useBlobs()) {
    const run = async () => {
      const data = await readLocalData();
      const result = await mutator(data);
      await writeLocalData(data);
      return result;
    };
    localQueue = localQueue.then(run, run);
    return localQueue;
  }

  for (let i = 0; i < 5; i += 1) {
    const store = await getDataBlobStore();
    const { data, etag } = await readBlobEntry();
    const result = await mutator(data);
    try {
      await writeBlobData(store, data, etag);
      return result;
    } catch (err) {
      if (!isWriteConflict(err) || i === 4) throw err;
    }
  }
  throw new Error('Ma\'lumot saqlashda ziddiyat yuz berdi');
}

function sortedRows(rows, table) {
  const list = [...rows];
  if (table === 'orders') {
    return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')) || (Number(b.id) - Number(a.id)));
  }
  if (SORTABLE_TABLES.has(table)) {
    return list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || (Number(a.id) - Number(b.id)));
  }
  return list.sort((a, b) => Number(a.id) - Number(b.id));
}

function nextId(data, table) {
  data.sequences[table] = Math.max(Number(data.sequences[table]) || 0, ...data[table].map(r => Number(r.id) || 0)) + 1;
  return data.sequences[table];
}

function pickColumns(src, columns) {
  const row = {};
  for (const col of columns) row[col] = src[col] == null ? null : src[col];
  return row;
}

async function getSetting(key) {
  const data = await loadData();
  return data.settings[key] || null;
}

async function getAllSettings() {
  const data = await loadData();
  return { ...data.settings };
}

async function setMany(settings) {
  return updateData((data) => {
    for (const [key, value] of Object.entries(settings || {})) {
      data.settings[key] = value == null ? '' : String(value);
    }
    return { ok: true, count: Object.keys(settings || {}).length };
  });
}

async function listRows(table) {
  if (!TABLES.includes(table)) throw new Error('Unknown table: ' + table);
  const data = await loadData();
  return sortedRows(data[table] || [], table);
}

async function createRow(table, columns, body) {
  if (!TABLES.includes(table)) throw new Error('Unknown table: ' + table);
  return updateData((data) => {
    const row = { id: nextId(data, table), ...pickColumns(body || {}, columns) };
    data[table].push(row);
    return row;
  });
}

async function updateRow(table, id, columns, body) {
  if (!TABLES.includes(table)) throw new Error('Unknown table: ' + table);
  return updateData((data) => {
    const row = data[table].find(item => Number(item.id) === Number(id));
    if (!row) return null;
    Object.assign(row, pickColumns(body || {}, columns));
    return row;
  });
}

async function deleteRow(table, id) {
  if (!TABLES.includes(table)) throw new Error('Unknown table: ' + table);
  return updateData((data) => {
    data[table] = data[table].filter(item => Number(item.id) !== Number(id));
    return { ok: true };
  });
}

async function reorderRows(table, ids) {
  if (!TABLES.includes(table)) throw new Error('Unknown table: ' + table);
  return updateData((data) => {
    ids.forEach((id, idx) => {
      const row = data[table].find(item => Number(item.id) === Number(id));
      if (row) row.sort_order = idx + 1;
    });
    return { ok: true };
  });
}

async function getSiteData() {
  const data = await loadData();
  const categories = sortedRows(data.categories, 'categories');
  const catById = new Map(categories.map(cat => [Number(cat.id), cat]));
  const products = sortedRows(data.products, 'products')
    .filter(product => Number(product.visible) === 1)
    .map(product => {
      const cat = catById.get(Number(product.category_id)) || {};
      return {
        id: product.id,
        name_uz: product.name_uz,
        name_ru: product.name_ru,
        alt_uz: product.alt_uz,
        alt_ru: product.alt_ru,
        image_path: product.image_path,
        price: product.price,
        price_ask: product.price_ask,
        badge_type: product.badge_type,
        badge_text: product.badge_text,
        category_slug: cat.slug,
        cat_short_uz: cat.short_uz,
        cat_short_ru: cat.short_ru,
      };
    });

  return {
    settings: { ...data.settings },
    heroSlides: sortedRows(data.hero_slides, 'hero_slides').map(({ id, image_path, alt_uz, alt_ru }) => ({ id, image_path, alt_uz, alt_ru })),
    marquee: sortedRows(data.marquee_items, 'marquee_items').map(({ id, text_uz, text_ru }) => ({ id, text_uz, text_ru })),
    categories: categories.map(({ id, slug, name_uz, name_ru, short_uz, short_ru }) => ({ id, slug, name_uz, name_ru, short_uz, short_ru })),
    products,
    testimonials: sortedRows(data.testimonials, 'testimonials').map(({ id, text_uz, text_ru, author_name, author_initials, city_uz, city_ru, stars }) => ({
      id, text_uz, text_ru, author_name, author_initials, city_uz, city_ru, stars,
    })),
  };
}

async function insertOrder(order) {
  return updateData((data) => {
    const row = {
      id: nextId(data, 'orders'),
      name: order.name,
      phone: order.phone,
      category: order.category || '',
      note: order.note || '',
      status: 'new',
      created_at: new Date().toISOString(),
    };
    data.orders.push(row);
    return row;
  });
}

async function listOrders({ limit = 100, status } = {}) {
  const data = await loadData();
  let rows = sortedRows(data.orders, 'orders');
  if (status) rows = rows.filter(row => row.status === status);
  return rows.slice(0, Math.min(Number(limit) || 100, 500));
}

async function updateOrderStatus(id, status) {
  return updateData((data) => {
    const row = data.orders.find(item => Number(item.id) === Number(id));
    if (row) row.status = status;
    return row || null;
  });
}

async function findAdminByUsername(username) {
  const data = await loadData();
  return data.admin_users.find(user => user.username === username) || null;
}

async function findAdminById(id) {
  const data = await loadData();
  return data.admin_users.find(user => Number(user.id) === Number(id)) || null;
}

async function updateAdminPassword(id, passwordHash) {
  return updateData((data) => {
    const user = data.admin_users.find(item => Number(item.id) === Number(id));
    if (!user) return null;
    user.password_hash = passwordHash;
    return user;
  });
}

async function seedDefaults({ reset = false } = {}) {
  if (reset) return saveData(makeDefaultData());
  const data = await loadData();
  const defaults = makeDefaultData();
  let changed = false;
  for (const table of TABLES) {
    if (data[table].length === 0 && defaults[table].length > 0) {
      data[table] = defaults[table];
      changed = true;
    }
  }
  if (Object.keys(data.settings).length === 0) {
    data.settings = defaults.settings;
    changed = true;
  }
  normalizeData(data);
  return changed ? saveData(data) : data;
}

module.exports = {
  useBlobs,
  loadData,
  seedDefaults,
  getSetting,
  getAllSettings,
  setMany,
  listRows,
  createRow,
  updateRow,
  deleteRow,
  reorderRows,
  getSiteData,
  insertOrder,
  listOrders,
  updateOrderStatus,
  findAdminByUsername,
  findAdminById,
  updateAdminPassword,
};
