const fs = require('fs/promises');
const path = require('path');
const { useBlobs } = require('./dataStore');

const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function cleanFilename(originalName) {
  const ext = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
  const safeBase = path.basename(originalName || 'img', path.extname(originalName || ''))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'img';
  const stamp = Date.now().toString(36);
  return `${safeBase}-${stamp}${ext}`;
}

function ensureImage(file) {
  if (!file) {
    const err = new Error('Rasm yuklanmadi');
    err.status = 400;
    throw err;
  }
  if (file.size > MAX_FILE_SIZE) {
    const err = new Error('Fayl 5MB dan katta');
    err.status = 413;
    throw err;
  }
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype || '')) {
    const err = new Error('Faqat JPG/PNG/WebP/GIF rasmlar yuklanadi');
    err.status = 400;
    throw err;
  }
}

async function getUploadBlobStore() {
  const mod = await import('@netlify/blobs');
  return mod.getStore(process.env.XFH_BLOBS_UPLOAD_STORE || 'xfh-uploads');
}

async function saveUpload(file) {
  ensureImage(file);
  const filename = cleanFilename(file.originalname);

  if (!useBlobs()) {
    await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
    await fs.writeFile(path.join(PUBLIC_IMAGES_DIR, filename), file.buffer);
    return { path: `images/${filename}` };
  }

  const store = await getUploadBlobStore();
  await store.set(filename, file.buffer, {
    metadata: {
      contentType: file.mimetype,
      originalName: file.originalname || filename,
      uploadedAt: new Date().toISOString(),
    },
  });
  return { path: `/api/uploads/${filename}` };
}

async function readUpload(filename) {
  const safeName = path.basename(filename || '');
  if (!safeName) return null;

  if (!useBlobs()) {
    try {
      const filePath = path.join(PUBLIC_IMAGES_DIR, safeName);
      const buffer = await fs.readFile(filePath);
      return { data: buffer, contentType: contentTypeFromName(safeName) };
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  const store = await getUploadBlobStore();
  const entry = await store.getWithMetadata(safeName, { type: 'arrayBuffer', consistency: 'strong' });
  if (!entry) return null;
  return {
    data: Buffer.from(entry.data),
    contentType: entry.metadata && entry.metadata.contentType ? entry.metadata.contentType : contentTypeFromName(safeName),
  };
}

function contentTypeFromName(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

module.exports = { saveUpload, readUpload, MAX_FILE_SIZE };
