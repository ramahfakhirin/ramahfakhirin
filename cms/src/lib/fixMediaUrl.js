/* -------------------------------------------------------------
   Helper: mengubah path gambar lokal menjadi URL absolute.
   - Mengabaikan http://, https://, data:, blob:
   - Path diawali slash (/assets/...) -> biarkan
   - Path relatif (assets/...) -> tambah slash depan (/assets/...)
   ------------------------------------------------------------- */
export function fixMediaUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (/^(https?:|data:|blob:|\/\/)/i.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}
