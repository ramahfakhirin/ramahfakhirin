import { useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, insertRow, logActivity, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { nextSortOrder, slugify, timeAgo, toArray } from '../lib/utils';
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
import { IconPlus, IconTrash } from '../components/Icons';

const blankPlan = (order) => ({
  slug: '',
  name: '',
  icon: '',
  price: '',
  price_note: 'Starting from',
  subtitle: '',
  description: '',
  features: [],
  meta_estimate: '',
  meta_revisions: '',
  meta_warranty: '',
  meta_button_class: 'btn-ghost',
  cta_label: 'Konsultasi',
  cta_url: 'contact.html',
  is_popular: false,
  is_published: true,
  sort_order: order,
});

const blankAddon = (order) => ({
  name: '',
  icon: '',
  price: '',
  price_note: '',
  description: '',
  is_published: true,
  sort_order: order,
});

/* Memecah kolom meta (jsonb) jadi field terpisah agar mudah diedit di form */
const toDraft = (row) => ({
  ...row,
  features: toArray(row.features),
  meta_estimate: row.meta?.estimate || '',
  meta_revisions: row.meta?.revisions || '',
  meta_warranty: row.meta?.warranty || '',
  meta_button_class: row.meta?.button_class || 'btn-ghost',
});

export default function Pricing() {
  const [tab, setTab] = useState('plans');
  const plans = useRealtimeTable('pricing_plans', { orderBy: 'sort_order' });
  const addons = useRealtimeTable('pricing_addons', { orderBy: 'sort_order' });

  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const isPlan = tab === 'plans';
  const table = isPlan ? 'pricing_plans' : 'pricing_addons';
  const current = isPlan ? plans : addons;

  const save = async () => {
    if (!draft.name?.trim()) {
      toast.error('Nama wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const payload = isPlan
        ? {
            slug: slugify(draft.slug || draft.name),
            name: draft.name.trim(),
            icon: draft.icon || null,
            price: draft.price || null,
            price_note: draft.price_note || null,
            subtitle: draft.subtitle || null,
            description: draft.description || null,
            features: toArray(draft.features),
            meta: {
              estimate: draft.meta_estimate || '',
              revisions: draft.meta_revisions || '',
              warranty: draft.meta_warranty || '',
              button_class: draft.meta_button_class || 'btn-ghost',
            },
            cta_label: draft.cta_label || null,
            cta_url: draft.cta_url || null,
            is_popular: !!draft.is_popular,
            is_published: !!draft.is_published,
            sort_order: Number(draft.sort_order) || 0,
          }
        : {
            name: draft.name.trim(),
            icon: draft.icon || null,
            price: draft.price || null,
            price_note: draft.price_note || null,
            description: draft.description || null,
            is_published: !!draft.is_published,
            sort_order: Number(draft.sort_order) || 0,
          };

      const saved = draft.id
        ? await updateRow(table, draft.id, payload)
        : await insertRow(table, payload);
      await logActivity(draft.id ? 'update' : 'create', table, saved.id, { name: saved.name });
      toast.success('Tersimpan.');
      setDraft(null);
    } catch (err) {
      toast.error(err.message?.includes('duplicate') ? 'Slug sudah dipakai paket lain.' : err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow(confirm._table, confirm.id);
      await logActivity('delete', confirm._table, confirm.id, { name: confirm.name });
      toast.success('Dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (plans.loading || addons.loading) return <Loading />;

  return (
    <>
      {(plans.error || addons.error) && <Alert tone="error">{plans.error || addons.error}</Alert>}

      <div className="rf-tabs">
        <button
          type="button"
          className={`rf-tab${isPlan ? ' is-active' : ''}`}
          onClick={() => setTab('plans')}
        >
          Paket Harga ({plans.rows.length})
        </button>
        <button
          type="button"
          className={`rf-tab${!isPlan ? ' is-active' : ''}`}
          onClick={() => setTab('addons')}
        >
          Add-On ({addons.rows.length})
        </button>
      </div>

      <div className="rf-toolbar">
        <span className={`rf-live${current.live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{current.live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button
          variant="primary"
          onClick={() =>
            setDraft(isPlan ? blankPlan(nextSortOrder(plans.rows)) : blankAddon(nextSortOrder(addons.rows)))
          }
        >
          <IconPlus size={15} /> {isPlan ? 'Paket Baru' : 'Add-On Baru'}
        </Button>
      </div>

      <Card flush>
        {current.rows.length === 0 ? (
          <EmptyState
            title={isPlan ? 'Belum ada paket' : 'Belum ada add-on'}
            text="Tambahkan item pertama."
          />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Urut</th>
                  <th>Nama</th>
                  <th>Harga</th>
                  {isPlan && <th>Fitur</th>}
                  {isPlan && <th>Populer</th>}
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {current.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.sort_order}</td>
                    <td className="rf-td-title">
                      {r.icon && <span style={{ marginRight: 8 }}>{r.icon}</span>}
                      {r.name}
                    </td>
                    <td>
                      {r.price || '—'}
                      {r.price_note && (
                        <div style={{ fontSize: 12, color: 'var(--rf-soft)' }}>{r.price_note}</div>
                      )}
                    </td>
                    {isPlan && <td>{toArray(r.features).length} item</td>}
                    {isPlan && (
                      <td>{r.is_popular ? <Badge tone="accent">Populer</Badge> : '—'}</td>
                    )}
                    <td>
                      <Badge tone={r.is_published ? 'on' : 'off'}>
                        {r.is_published ? 'Tayang' : 'Draft'}
                      </Badge>
                    </td>
                    <td>{timeAgo(r.updated_at)}</td>
                    <td className="rf-td-actions">
                      <Button
                        size="sm"
                        onClick={() => setDraft(toDraft(r))}
                      >
                        Edit
                      </Button>{' '}
                      <Button
                        size="icon"
                        variant="danger"
                        onClick={() => setConfirm({ ...r, _table: table })}
                      >
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
        title={draft?.id ? 'Edit' : isPlan ? 'Paket Baru' : 'Add-On Baru'}
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
              <Field label="Ikon" hint="Emoji, contoh: 🚀">
                <Input
                  value={draft.icon || ''}
                  placeholder="🚀"
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                />
              </Field>
              <Field label="Nama" required>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Harga">
                <Input
                  value={draft.price || ''}
                  placeholder={isPlan ? 'Rp 12.500.000' : 'Rp 250k'}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </Field>
            </div>

            <div className="rf-grid-2">
              {isPlan && (
                <Field label="Slug">
                  <Input
                    value={draft.slug || ''}
                    placeholder={slugify(draft.name || '')}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
                </Field>
              )}
              <Field
                label="Keterangan Harga"
                hint={isPlan ? 'Teks kecil di atas harga' : 'Contoh: /year, /page, starting from'}
              >
                <Input
                  value={draft.price_note || ''}
                  placeholder={isPlan ? 'Starting from' : '/year'}
                  onChange={(e) => setDraft({ ...draft, price_note: e.target.value })}
                />
              </Field>
            </div>

            {isPlan && (
              <Field label="Subjudul" hint="Teks kecil di bawah harga">
                <Input
                  value={draft.subtitle || ''}
                  placeholder="One-time payment • includes domain & 1-year hosting"
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                />
              </Field>
            )}

            <Field label="Deskripsi">
              <Textarea
                rows={3}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>

            {isPlan && (
              <>
                <Field label="Daftar Fitur" hint="Ketik lalu tekan Enter">
                  <TagInput
                    value={toArray(draft.features)}
                    onChange={(features) => setDraft({ ...draft, features })}
                  />
                </Field>

                <div className="rf-grid-3">
                  <Field label="Estimasi Pengerjaan">
                    <Input
                      value={draft.meta_estimate || ''}
                      placeholder="14–21 working days"
                      onChange={(e) => setDraft({ ...draft, meta_estimate: e.target.value })}
                    />
                  </Field>
                  <Field label="Jumlah Revisi">
                    <Input
                      value={draft.meta_revisions || ''}
                      placeholder="4x"
                      onChange={(e) => setDraft({ ...draft, meta_revisions: e.target.value })}
                    />
                  </Field>
                  <Field label="Garansi & Support">
                    <Input
                      value={draft.meta_warranty || ''}
                      placeholder="3 months"
                      onChange={(e) => setDraft({ ...draft, meta_warranty: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="rf-grid-3">
                  <Field label="Label Tombol">
                    <Input
                      value={draft.cta_label || ''}
                      onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
                    />
                  </Field>
                  <Field label="URL Tombol">
                    <Input
                      value={draft.cta_url || ''}
                      onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
                    />
                  </Field>
                  <Field label="Gaya Tombol">
                    <Select
                      value={draft.meta_button_class || 'btn-ghost'}
                      onChange={(e) => setDraft({ ...draft, meta_button_class: e.target.value })}
                    >
                      <option value="btn-ghost">Ghost — outline</option>
                      <option value="btn-purple">Purple — solid ungu</option>
                      <option value="btn-grad">Gradient — kartu unggulan</option>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            <Field label="Urutan">
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </Field>

            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              <Switch
                checked={draft.is_published}
                onChange={(v) => setDraft({ ...draft, is_published: v })}
                label="Tayangkan"
              />
              {isPlan && (
                <Switch
                  checked={draft.is_popular}
                  onChange={(v) => setDraft({ ...draft, is_popular: v })}
                  label="Tandai paling populer"
                />
              )}
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus Item"
        message={`"${confirm?.name}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
