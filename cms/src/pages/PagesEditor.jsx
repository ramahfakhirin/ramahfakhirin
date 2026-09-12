import { useEffect, useMemo, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, logActivity, saveSection } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { slugify, timeAgo } from '../lib/utils';
import ImageField from '../components/ImageField';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Loading,
  Modal,
  ConfirmDialog,
  Repeater,
  Select,
  Switch,
  Textarea,
} from '../components/ui';
import { IconPlus, IconTrash } from '../components/Icons';

const KINDS = [
  { value: 'hero', label: 'Hero — judul besar halaman' },
  { value: 'rich', label: 'Rich — judul + paragraf' },
  { value: 'list', label: 'List — daftar item berulang' },
  { value: 'stat', label: 'Stat — angka statistik' },
  { value: 'faq', label: 'FAQ — tanya jawab' },
  { value: 'cta', label: 'CTA — ajakan bertindak' },
  { value: 'raw', label: 'Raw — HTML bebas' },
];

const LIST_FIELDS = [
  { key: 'num', label: 'Nomor / Urutan', placeholder: '01' },
  { key: 'title', label: 'Judul Item', placeholder: 'Consultation' },
  { key: 'text', label: 'Deskripsi', type: 'textarea', rows: 2 },
];

const STAT_FIELDS = [
  { key: 'value', label: 'Angka', placeholder: '231+' },
  { key: 'label', label: 'Label', placeholder: 'Clients served' },
  { key: 'note', label: 'Catatan', placeholder: 'Sejak 2016' },
];

const FAQ_FIELDS = [
  { key: 'question', label: 'Pertanyaan' },
  { key: 'answer', label: 'Jawaban', type: 'textarea', rows: 3 },
];

const blankSection = (pageSlug, sortOrder) => ({
  page_slug: pageSlug,
  key: '',
  kind: 'rich',
  label: '',
  body: {},
  sort_order: sortOrder,
  is_published: true,
});

export default function PagesEditor() {
  const pages = useRealtimeTable('pages', { orderBy: 'sort_order' });
  const [activePage, setActivePage] = useState('');
  const sections = useRealtimeTable('sections', {
    orderBy: 'sort_order',
    filterColumn: 'page_slug',
    filterValue: activePage || null,
    enabled: Boolean(activePage),
  });

  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!activePage && pages.rows.length) setActivePage(pages.rows[0].slug);
  }, [pages.rows, activePage]);

  const currentPage = useMemo(
    () => pages.rows.find((p) => p.slug === activePage),
    [pages.rows, activePage]
  );

  const setBody = (key, value) =>
    setDraft((d) => ({ ...d, body: { ...(d.body || {}), [key]: value } }));

  const openNew = () => {
    const nextOrder = sections.rows.length
      ? Math.max(...sections.rows.map((s) => s.sort_order || 0)) + 1
      : 1;
    setDraft(blankSection(activePage, nextOrder));
  };

  const save = async () => {
    if (!draft.key.trim()) {
      toast.error('Kunci section wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSection({ ...draft, key: slugify(draft.key).replace(/-/g, '_') });
      await logActivity(draft.id ? 'update' : 'create', 'sections', saved.id, {
        page: draft.page_slug,
        key: saved.key,
      });
      toast.success('Section tersimpan.');
      setDraft(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow('sections', confirm.id);
      await logActivity('delete', 'sections', confirm.id, { key: confirm.key });
      toast.success('Section dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (section) => {
    try {
      await saveSection({ ...section, is_published: !section.is_published });
    } catch (err) {
      toast.error(err);
    }
  };

  if (pages.loading) return <Loading />;

  return (
    <>
      {(pages.error || sections.error) && (
        <Alert tone="error">{pages.error || sections.error}</Alert>
      )}

      <div className="rf-tabs">
        {pages.rows.map((p) => (
          <button
            key={p.slug}
            type="button"
            className={`rf-tab${p.slug === activePage ? ' is-active' : ''}`}
            onClick={() => setActivePage(p.slug)}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="rf-toolbar">
        <span className={`rf-live${sections.live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{sections.live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button variant="primary" onClick={openNew} disabled={!activePage}>
          <IconPlus size={15} /> Tambah Section
        </Button>
      </div>

      <Card
        title={currentPage?.title || 'Halaman'}
        subtitle={currentPage ? `File: ${currentPage.file_name}` : ''}
        flush
      >
        {sections.loading ? (
          <Loading />
        ) : sections.rows.length === 0 ? (
          <EmptyState
            title="Belum ada section"
            text="Tambahkan blok konten untuk halaman ini."
            action={
              <Button variant="primary" onClick={openNew}>
                <IconPlus size={15} /> Tambah Section
              </Button>
            }
          />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Urut</th>
                  <th>Section</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sections.rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.sort_order}</td>
                    <td>
                      <div className="rf-td-title">{s.label || s.key}</div>
                      <div style={{ fontSize: 12, color: 'var(--rf-soft)' }}>
                        data-cms="{s.page_slug}.{s.key}"
                      </div>
                    </td>
                    <td>
                      <Badge tone="accent">{s.kind}</Badge>
                    </td>
                    <td>
                      <Switch checked={s.is_published} onChange={() => togglePublish(s)} />
                    </td>
                    <td>{timeAgo(s.updated_at)}</td>
                    <td className="rf-td-actions">
                      <Button size="sm" onClick={() => setDraft({ ...s, body: s.body || {} })}>
                        Edit
                      </Button>{' '}
                      <Button size="icon" variant="danger" onClick={() => setConfirm(s)}>
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
        title={draft?.id ? 'Edit Section' : 'Section Baru'}
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
            <div className="rf-grid-3">
              <Field label="Kunci Section" required hint="Dipakai di HTML: data-cms">
                <Input
                  value={draft.key}
                  placeholder="hero"
                  onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                />
              </Field>
              <Field label="Nama Tampilan">
                <Input
                  value={draft.label || ''}
                  placeholder="Hero Halaman Home"
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </Field>
              <Field label="Urutan">
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Tipe Section">
              <Select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>

            {['hero', 'rich', 'cta', 'list', 'stat'].includes(draft.kind) && (
              <>
                {draft.kind === 'hero' && (
                  <Field label="Eyebrow" hint="Teks kecil di atas judul">
                    <Input
                      value={draft.body?.eyebrow || ''}
                      onChange={(e) => setBody('eyebrow', e.target.value)}
                    />
                  </Field>
                )}

                <Field label="Judul" hint="Boleh pakai HTML: <br>, <span>, <em>">
                  <Textarea
                    rows={2}
                    value={draft.body?.title || ''}
                    onChange={(e) => setBody('title', e.target.value)}
                  />
                </Field>

                {draft.kind !== 'list' && draft.kind !== 'stat' && (
                  <Field label={draft.kind === 'hero' ? 'Subjudul' : 'Konten'}>
                    <Textarea
                      rows={4}
                      value={draft.body?.subtitle ?? draft.body?.content ?? ''}
                      onChange={(e) =>
                        setBody(draft.kind === 'hero' ? 'subtitle' : 'content', e.target.value)
                      }
                    />
                  </Field>
                )}
              </>
            )}

            {['hero', 'cta'].includes(draft.kind) && (
              <div className="rf-grid-2">
                <Field label="Label Tombol">
                  <Input
                    value={draft.body?.cta_label || ''}
                    placeholder="Let's Talk"
                    onChange={(e) => setBody('cta_label', e.target.value)}
                  />
                </Field>
                <Field label="URL Tombol">
                  <Input
                    value={draft.body?.cta_url || ''}
                    placeholder="contact.html"
                    onChange={(e) => setBody('cta_url', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {['list', 'stat', 'faq'].includes(draft.kind) && (
              <Field label="Daftar Item">
                <Repeater
                  items={draft.body?.items || []}
                  onChange={(items) => setBody('items', items)}
                  fields={
                    draft.kind === 'stat' ? STAT_FIELDS : draft.kind === 'faq' ? FAQ_FIELDS : LIST_FIELDS
                  }
                />
              </Field>
            )}

            {draft.kind === 'raw' && (
              <Field label="HTML" hint="Ditulis apa adanya ke halaman. Hanya isi dengan HTML tepercaya.">
                <Textarea
                  code
                  rows={9}
                  value={draft.body?.html || ''}
                  onChange={(e) => setBody('html', e.target.value)}
                />
              </Field>
            )}

            {draft.kind !== 'raw' && (
              <ImageField
                label="Gambar Pendukung"
                value={draft.body?.image || ''}
                folder={`sections/${draft.page_slug}`}
                onChange={(url) => setBody('image', url)}
              />
            )}

            <Field>
              <Switch
                checked={draft.is_published}
                onChange={(v) => setDraft({ ...draft, is_published: v })}
                label="Tayangkan section ini"
              />
            </Field>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus Section"
        message={`Section "${confirm?.label || confirm?.key}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
