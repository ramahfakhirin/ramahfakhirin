import { useMemo, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, insertRow, logActivity, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { nextSortOrder, slugify, timeAgo, toArray } from '../lib/utils';
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
  Switch,
  TagInput,
  Textarea,
} from '../components/ui';
import { IconPlus, IconSearch, IconTrash } from '../components/Icons';

const blank = (order) => ({
  slug: '',
  title: '',
  category: '',
  client: '',
  year: String(new Date().getFullYear()),
  summary: '',
  content: '',
  thumbnail: '',
  url: '',
  tags: [],
  is_featured: false,
  is_published: true,
  sort_order: order,
});

export default function Portfolio() {
  const { rows, loading, error, live } = useRealtimeTable('projects', { orderBy: 'sort_order' });
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const toast = useToast();

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.title, r.category, r.client, r.slug].some((v) => String(v || '').toLowerCase().includes(term))
    );
  }, [rows, q]);

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error('Judul project wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        slug: slugify(draft.slug || draft.title),
        title: draft.title.trim(),
        category: draft.category || null,
        client: draft.client || null,
        year: draft.year || null,
        summary: draft.summary || null,
        content: draft.content || null,
        thumbnail: draft.thumbnail || null,
        url: draft.url || null,
        tags: toArray(draft.tags),
        is_featured: !!draft.is_featured,
        is_published: !!draft.is_published,
        sort_order: Number(draft.sort_order) || 0,
      };

      const saved = draft.id
        ? await updateRow('projects', draft.id, payload)
        : await insertRow('projects', payload);

      await logActivity(draft.id ? 'update' : 'create', 'projects', saved.id, { title: saved.title });
      toast.success('Project tersimpan.');
      setDraft(null);
    } catch (err) {
      toast.error(err.message?.includes('duplicate') ? 'Slug sudah dipakai project lain.' : err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow('projects', confirm.id);
      await logActivity('delete', 'projects', confirm.id, { title: confirm.title });
      toast.success('Project dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row, key) => {
    try {
      await updateRow('projects', row.id, { [key]: !row[key] });
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
          <Input placeholder="Cari project…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className={`rf-live${live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button variant="primary" onClick={() => setDraft(blank(nextSortOrder(rows)))}>
          <IconPlus size={15} /> Project Baru
        </Button>
      </div>

      <Card flush>
        {filtered.length === 0 ? (
          <EmptyState
            title={q ? 'Tidak ada hasil' : 'Belum ada project'}
            text={q ? 'Coba kata kunci lain.' : 'Tambahkan project pertama ke portfolio.'}
          />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Gambar</th>
                  <th>Project</th>
                  <th>Kategori</th>
                  <th>Tahun</th>
                  <th>Unggulan</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.thumbnail ? (
                        <img className="rf-thumb" src={fixMediaUrl(r.thumbnail)} alt="" />
                      ) : (
                        <div className="rf-thumb rf-thumb-empty">—</div>
                      )}
                    </td>
                    <td>
                      <div className="rf-td-title">{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--rf-soft)' }}>{r.slug}</div>
                    </td>
                    <td>{r.category || '—'}</td>
                    <td>{r.year || '—'}</td>
                    <td>
                      <Switch checked={r.is_featured} onChange={() => toggle(r, 'is_featured')} />
                    </td>
                    <td>
                      <Badge tone={r.is_published ? 'on' : 'off'}>
                        {r.is_published ? 'Tayang' : 'Draft'}
                      </Badge>
                    </td>
                    <td>{timeAgo(r.updated_at)}</td>
                    <td className="rf-td-actions">
                      <Button size="sm" onClick={() => setDraft({ ...r, tags: toArray(r.tags) })}>
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
        title={draft?.id ? 'Edit Project' : 'Project Baru'}
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
            <div className="rf-grid-2">
              <Field label="Judul" required>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <Field label="Slug" hint="Kosongkan untuk dibuat otomatis dari judul">
                <Input
                  value={draft.slug}
                  placeholder={slugify(draft.title)}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </Field>
            </div>

            <div className="rf-grid-3">
              <Field label="Kategori">
                <Input
                  value={draft.category || ''}
                  placeholder="Web Development"
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </Field>
              <Field label="Klien">
                <Input
                  value={draft.client || ''}
                  onChange={(e) => setDraft({ ...draft, client: e.target.value })}
                />
              </Field>
              <Field label="Tahun">
                <Input
                  value={draft.year || ''}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Ringkasan" hint="Muncul di kartu portfolio">
              <Textarea
                rows={3}
                value={draft.summary || ''}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              />
            </Field>

            <Field label="Deskripsi Lengkap">
              <Textarea
                rows={6}
                value={draft.content || ''}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </Field>

            <ImageField
              label="Thumbnail"
              value={draft.thumbnail}
              folder="portfolio"
              onChange={(url) => setDraft({ ...draft, thumbnail: url })}
            />

            <div className="rf-grid-2">
              <Field label="URL Project">
                <Input
                  value={draft.url || ''}
                  placeholder="https://nanoidn.com"
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </Field>
              <Field label="Urutan Tampil">
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Tag">
              <TagInput
                value={toArray(draft.tags)}
                onChange={(tags) => setDraft({ ...draft, tags })}
              />
            </Field>

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
        title="Hapus Project"
        message={`Project "${confirm?.title}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
