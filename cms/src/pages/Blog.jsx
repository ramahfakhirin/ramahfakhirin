import { useMemo, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, insertRow, logActivity, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { formatDate, slugify, timeAgo, toArray } from '../lib/utils';
import { fixMediaUrl } from '../lib/fixMediaUrl';
import ImageField from '../components/ImageField';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  Switch,
  TagInput,
  Textarea,
} from '../components/ui';
import { IconPlus, IconSearch, IconTrash } from '../components/Icons';

const blank = () => ({
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  cover: '',
  category: '',
  tags: [],
  author: 'Ramah Fakhirin',
  read_minutes: 5,
  is_featured: false,
  is_published: false,
  published_at: '',
});

const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Blog() {
  const { rows, loading, error, live } = useRealtimeTable('posts', {
    orderBy: 'created_at',
    ascending: false,
  });
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (filter === 'published' && !r.is_published) return false;
      if (filter === 'draft' && r.is_published) return false;
      if (!term) return true;
      return [r.title, r.category, r.slug].some((v) =>
        String(v || '').toLowerCase().includes(term)
      );
    });
  }, [rows, q, filter]);

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error('Judul artikel wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const publishedAt =
        draft.is_published && !draft.published_at
          ? new Date().toISOString()
          : draft.published_at
          ? new Date(draft.published_at).toISOString()
          : null;

      const payload = {
        slug: slugify(draft.slug || draft.title),
        title: draft.title.trim(),
        excerpt: draft.excerpt || null,
        content: draft.content || null,
        cover: draft.cover || null,
        category: draft.category || null,
        tags: toArray(draft.tags),
        author: draft.author || null,
        read_minutes: Number(draft.read_minutes) || 5,
        is_featured: !!draft.is_featured,
        is_published: !!draft.is_published,
        published_at: publishedAt,
      };

      const saved = draft.id
        ? await updateRow('posts', draft.id, payload)
        : await insertRow('posts', payload);
      await logActivity(draft.id ? 'update' : 'create', 'posts', saved.id, { title: saved.title });
      toast.success('Artikel tersimpan.');
      setDraft(null);
    } catch (err) {
      toast.error(err.message?.includes('duplicate') ? 'Slug sudah dipakai artikel lain.' : err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow('posts', confirm.id);
      await logActivity('delete', 'posts', confirm.id, { title: confirm.title });
      toast.success('Artikel dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (row) => {
    try {
      await updateRow('posts', row.id, {
        is_published: !row.is_published,
        published_at: !row.is_published && !row.published_at ? new Date().toISOString() : row.published_at,
      });
    } catch (err) {
      toast.error(err);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="rf-toolbar">
        <div className="rf-search">
          <IconSearch />
          <Input placeholder="Cari artikel…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">Semua status</option>
          <option value="published">Tayang</option>
          <option value="draft">Draft</option>
        </Select>
        <span className={`rf-live${live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button variant="primary" onClick={() => setDraft(blank())}>
          <IconPlus size={15} /> Tulis Artikel
        </Button>
      </div>

      <Card flush>
        {filtered.length === 0 ? (
          <EmptyState
            title={q || filter !== 'all' ? 'Tidak ada hasil' : 'Belum ada artikel'}
            text="Mulai tulis artikel pertama."
          />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Cover</th>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Views</th>
                  <th>Tayang</th>
                  <th>Terbit</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.cover ? (
                        <img className="rf-thumb" src={fixMediaUrl(r.cover)} alt="" />
                      ) : (
                        <div className="rf-thumb rf-thumb-empty">—</div>
                      )}
                    </td>
                    <td>
                      <div className="rf-td-title">{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--rf-soft)' }}>
                        {r.slug} · {timeAgo(r.updated_at)}
                      </div>
                    </td>
                    <td>{r.category || '—'}</td>
                    <td>{r.views || 0}</td>
                    <td>
                      <Switch checked={r.is_published} onChange={() => togglePublish(r)} />
                    </td>
                    <td>{r.published_at ? formatDate(r.published_at) : <Badge tone="off">Draft</Badge>}</td>
                    <td className="rf-td-actions">
                      <Button
                        size="sm"
                        onClick={() =>
                          setDraft({
                            ...r,
                            tags: toArray(r.tags),
                            published_at: toLocalInput(r.published_at),
                          })
                        }
                      >
                        Edit
                      </Button>{' '}
                      <Button size="icon" variant="danger" onClick={() => setConfirm(r)}>
                        <IconTrash size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(draft)}
        title={draft?.id ? 'Edit Artikel' : 'Artikel Baru'}
        onClose={() => setDraft(null)}
        width="wide"
        footer={
          <>
            <Button onClick={() => setDraft(null)} disabled={busy}>
              Batal
            </Button>
            <Button variant="primary" onClick={save} loading={busy}>
              Simpan
            </Button>
          </>
        }
      >
        {draft && (
          <>
            <Field label="Judul" required>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>

            <div className="rf-grid-2">
              <Field label="Slug" hint="Kosongkan untuk otomatis">
                <Input
                  value={draft.slug}
                  placeholder={slugify(draft.title)}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </Field>
              <Field label="Kategori">
                <Input
                  value={draft.category || ''}
                  placeholder="Business"
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Ringkasan" hint="Tampil di kartu daftar artikel">
              <Textarea
                rows={3}
                value={draft.excerpt || ''}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              />
            </Field>

            <Field label="Isi Artikel" hint="Mendukung HTML: <p>, <h3>, <ul>, <strong>">
              <Textarea
                code
                rows={14}
                value={draft.content || ''}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </Field>

            <ImageField
              label="Cover"
              value={draft.cover}
              folder="blog"
              onChange={(url) => setDraft({ ...draft, cover: url })}
            />

            <Field label="Tag">
              <TagInput value={toArray(draft.tags)} onChange={(tags) => setDraft({ ...draft, tags })} />
            </Field>

            <div className="rf-grid-3">
              <Field label="Penulis">
                <Input
                  value={draft.author || ''}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                />
              </Field>
              <Field label="Estimasi Baca (menit)">
                <Input
                  type="number"
                  value={draft.read_minutes}
                  onChange={(e) => setDraft({ ...draft, read_minutes: e.target.value })}
                />
              </Field>
              <Field label="Tanggal Terbit">
                <Input
                  type="datetime-local"
                  value={draft.published_at || ''}
                  onChange={(e) => setDraft({ ...draft, published_at: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              <Switch
                checked={draft.is_published}
                onChange={(v) => setDraft({ ...draft, is_published: v })}
                label="Tayangkan"
              />
              <Switch
                checked={draft.is_featured}
                onChange={(v) => setDraft({ ...draft, is_featured: v })}
                label="Jadikan unggulan"
              />
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus Artikel"
        message={`Artikel "${confirm?.title}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
