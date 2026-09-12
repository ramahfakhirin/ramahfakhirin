import { useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, insertRow, logActivity, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { nextSortOrder, slugify, timeAgo, toArray } from '../lib/utils';
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
  Repeater,
  Select,
  Switch,
  TagInput,
  Textarea,
} from '../components/ui';
import { IconPlus, IconTrash } from '../components/Icons';

const blank = (order) => ({
  slug: '',
  title: '',
  subtitle: 'What you get',
  label: '',
  kind: 'core',
  anchor: '',
  description: '',
  icon: '',
  image: '',
  tags: [],
  features: [],
  meta: [],
  dlv_note: '',
  is_published: true,
  sort_order: order,
});

const toDraft = (row) => ({
  ...row,
  tags: toArray(row.tags),
  features: toArray(row.features),
  meta: Array.isArray(row.meta) ? row.meta : [],
});

export default function Services() {
  const { rows, loading, error, live } = useRealtimeTable('services', { orderBy: 'sort_order' });
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error('Nama layanan wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        slug: slugify(draft.slug || draft.title),
        title: draft.title.trim(),
        subtitle: draft.subtitle || null,
        label: draft.label || null,
        kind: draft.kind || 'core',
        anchor: draft.anchor || null,
        description: draft.description || null,
        icon: draft.icon || null,
        image: draft.image || null,
        tags: toArray(draft.tags),
        features: toArray(draft.features),
        meta: Array.isArray(draft.meta) ? draft.meta.filter((m) => m.label || m.value) : [],
        dlv_note: draft.dlv_note || null,
        is_published: !!draft.is_published,
        sort_order: Number(draft.sort_order) || 0,
      };
      const saved = draft.id
        ? await updateRow('services', draft.id, payload)
        : await insertRow('services', payload);
      await logActivity(draft.id ? 'update' : 'create', 'services', saved.id, { title: saved.title });
      toast.success('Layanan tersimpan.');
      setDraft(null);
    } catch (err) {
      toast.error(err.message?.includes('duplicate') ? 'Slug sudah dipakai layanan lain.' : err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow('services', confirm.id);
      await logActivity('delete', 'services', confirm.id, { title: confirm.title });
      toast.success('Layanan dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="rf-toolbar">
        <span className={`rf-live${live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button variant="primary" onClick={() => setDraft(blank(nextSortOrder(rows)))}>
          <IconPlus size={15} /> Layanan Baru
        </Button>
      </div>

      <Card flush>
        {rows.length === 0 ? (
          <EmptyState title="Belum ada layanan" text="Tambahkan layanan yang kamu tawarkan." />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Urut</th>
                  <th>Layanan</th>
                  <th>Jenis</th>
                  <th>Deliverable</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.sort_order}</td>
                    <td>
                      <div className="rf-td-title">
                        {r.icon && <span style={{ marginRight: 8 }}>{r.icon}</span>}
                        {r.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--rf-soft)' }}>
                        {r.label || r.slug}
                      </div>
                    </td>
                    <td>
                      <Badge tone={r.kind === 'division' ? 'accent' : 'off'}>
                        {r.kind === 'division' ? 'Divisi' : 'Inti'}
                      </Badge>
                    </td>
                    <td>{toArray(r.features).length} item</td>
                    <td>
                      <Badge tone={r.is_published ? 'on' : 'off'}>
                        {r.is_published ? 'Tayang' : 'Draft'}
                      </Badge>
                    </td>
                    <td>{timeAgo(r.updated_at)}</td>
                    <td className="rf-td-actions">
                      <Button size="sm" onClick={() => setDraft(toDraft(r))}>
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
        title={draft?.id ? 'Edit Layanan' : 'Layanan Baru'}
        onClose={() => setDraft(null)}
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
            <div className="rf-grid-3">
              <Field label="Ikon" hint="Emoji, contoh: 🌐">
                <Input
                  value={draft.icon || ''}
                  placeholder="🌐"
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                />
              </Field>
              <Field label="Nama Layanan" required>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <Input
                  value={draft.slug}
                  placeholder={slugify(draft.title)}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </Field>
            </div>

            <div className="rf-grid-3">
              <Field label="Jenis">
                <Select
                  value={draft.kind || 'core'}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
                >
                  <option value="core">Inti — blok layanan utama</option>
                  <option value="division">Divisi — kartu spesialis</option>
                </Select>
              </Field>
              <Field label="Nomor Layanan" hint="Contoh: Service 01">
                <Input
                  value={draft.label || ''}
                  placeholder="Service 01"
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </Field>
              <Field label="Anchor" hint="ID section di HTML">
                <Input
                  value={draft.anchor || ''}
                  placeholder="web"
                  onChange={(e) => setDraft({ ...draft, anchor: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Deskripsi">
              <Textarea
                rows={4}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>

            <Field label="Tag Teknologi" hint="Ketik lalu tekan Enter. Contoh: Laravel, Next.js">
              <TagInput
                value={toArray(draft.tags)}
                onChange={(tags) => setDraft({ ...draft, tags })}
              />
            </Field>

            <Field label="Info Ringkas" hint="Timeline, harga mulai, dan sejenisnya">
              <Repeater
                items={draft.meta || []}
                onChange={(meta) => setDraft({ ...draft, meta })}
                fields={[
                  { key: 'label', label: 'Label', placeholder: 'Typical timeline' },
                  { key: 'value', label: 'Nilai', placeholder: '7 days – 3 months' },
                ]}
                addLabel="Tambah Info"
                emptyText="Belum ada info ringkas."
              />
            </Field>

            <div className="rf-grid-2">
              <Field label="Judul Blok Deliverable">
                <Input
                  value={draft.subtitle || ''}
                  placeholder="What you get"
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                />
              </Field>
              <Field label="Keterangan Blok">
                <Input
                  value={draft.dlv_note || ''}
                  placeholder="Deliverables included in every web project"
                  onChange={(e) => setDraft({ ...draft, dlv_note: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Daftar Deliverable" hint="Ketik lalu tekan Enter untuk menambah">
              <TagInput
                value={toArray(draft.features)}
                onChange={(features) => setDraft({ ...draft, features })}
              />
            </Field>

            <ImageField
              label="Gambar Layanan"
              value={draft.image}
              folder="services"
              onChange={(url) => setDraft({ ...draft, image: url })}
            />

            <Field label="Urutan">
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </Field>

            <Switch
              checked={draft.is_published}
              onChange={(v) => setDraft({ ...draft, is_published: v })}
              label="Tayangkan"
            />
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus Layanan"
        message={`Layanan "${confirm?.title}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
