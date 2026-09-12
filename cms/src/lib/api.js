import { assertClient, BUCKET } from './supabase';

/* -------------------------------------------------------------
   Generic table helpers
   ------------------------------------------------------------- */
export async function listRows(table, { orderBy = 'sort_order', ascending = true, limit } = {}) {
  const db = assertClient();
  let query = db.from(table).select('*').order(orderBy, { ascending, nullsFirst: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function countRows(table, filters = {}) {
  const db = assertClient();
  let query = db.from(table).select('*', { count: 'exact', head: true });
  Object.entries(filters).forEach(([col, val]) => {
    query = query.eq(col, val);
  });
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function insertRow(table, payload) {
  const db = assertClient();
  const { data, error } = await db.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, payload, idColumn = 'id') {
  const db = assertClient();
  const { data, error } = await db
    .from(table)
    .update(payload)
    .eq(idColumn, id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertRow(table, payload, onConflict) {
  const db = assertClient();
  const { data, error } = await db
    .from(table)
    .upsert(payload, onConflict ? { onConflict } : undefined)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id, idColumn = 'id') {
  const db = assertClient();
  const { error } = await db.from(table).delete().eq(idColumn, id);
  if (error) throw error;
}

/* -------------------------------------------------------------
   Sections
   ------------------------------------------------------------- */
export async function listSections(pageSlug) {
  const db = assertClient();
  let query = db.from('sections').select('*').order('sort_order', { ascending: true });
  if (pageSlug) query = query.eq('page_slug', pageSlug);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveSection(section) {
  const payload = {
    page_slug: section.page_slug,
    key: section.key,
    kind: section.kind || 'rich',
    label: section.label || null,
    body: section.body || {},
    sort_order: Number(section.sort_order) || 0,
    is_published: section.is_published !== false,
  };
  if (section.id) return updateRow('sections', section.id, payload);
  return upsertRow('sections', payload, 'page_slug,key');
}

/* -------------------------------------------------------------
   Settings (key/value)
   ------------------------------------------------------------- */
export async function listSettings() {
  const db = assertClient();
  const { data, error } = await db.from('settings').select('*').order('group', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveSetting(key, value, meta = {}) {
  return upsertRow(
    'settings',
    { key, value, label: meta.label ?? null, group: meta.group ?? 'general' },
    'key'
  );
}

/* -------------------------------------------------------------
   Storage
   ------------------------------------------------------------- */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadImage(file, folder = 'uploads') {
  const db = assertClient();
  if (!file) throw new Error('File tidak ditemukan.');
  if (!file.type.startsWith('image/')) throw new Error('Hanya file gambar yang diizinkan.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Ukuran file maksimal 5 MB.');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (upErr) throw upErr;

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  await db.from('media').insert({
    path,
    url,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });

  return { path, url };
}

export async function deleteImage(path) {
  const db = assertClient();
  if (!path) return;
  const { error } = await db.storage.from(BUCKET).remove([path]);
  if (error) throw error;
  await db.from('media').delete().eq('path', path);
}

export async function listMedia(limit = 120) {
  return listRows('media', { orderBy: 'created_at', ascending: false, limit });
}

/* -------------------------------------------------------------
    Activity log (best effort, tidak boleh menggagalkan aksi utama)
    ------------------------------------------------------------- */
export async function logActivity(action, entity, entityId, detail = {}) {
  try {
    const db = assertClient();
    const { data: sess } = await db.auth.getUser();
    await db.from('activity_log').insert({
      actor: sess?.user?.email || 'unknown',
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      detail,
    });
  } catch {
    /* diam-diam saja: log gagal tidak boleh membatalkan perubahan konten */
  }
}

/* -------------------------------------------------------------
    Shortlinks
    ------------------------------------------------------------- */
export async function listShortlinks(limit = 100) {
  return listRows('shortlinks', { orderBy: 'created_at', ascending: false, limit });
}

export async function createShortlink(fullUrl, code) {
  const data = await insertRow('shortlinks', { code, full_url: fullUrl });
  return data;
}

export async function updateShortlink(id, payload) {
  return updateRow('shortlinks', id, payload);
}

export async function deleteShortlink(id) {
  return deleteRow('shortlinks', id);
}

export async function incrementShortlinkClicks(code) {
  const db = assertClient();
  const { data, error } = await db.rpc('increment_shortlink_clicks', { p_code: code });
  if (error) throw error;
  return data;
}
