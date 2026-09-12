import { useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, insertRow, logActivity, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { nextSortOrder, stripHtml, timeAgo } from '../lib/utils';
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
  Textarea,
} from '../components/ui';
import { IconPlus, IconTrash } from '../components/Icons';

const blank = (order) => ({
  page_slug: 'contact',
  question: '',
  answer: '',
  is_published: true,
  sort_order: order,
});

export default function Faq() {
  const { rows, loading, error, live } = useRealtimeTable('faqs', { orderBy: 'sort_order' });
  const pages = useRealtimeTable('pages', { orderBy: 'sort_order' });
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const save = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast.error('Pertanyaan dan jawaban wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        page_slug: draft.page_slug,
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        is_published: !!draft.is_published,
        sort_order: Number(draft.sort_order) || 0,
      };
      const saved = draft.id
        ? await updateRow('faqs', draft.id, payload)
        : await insertRow('faqs', payload);
      await logActivity(draft.id ? 'update' : 'create', 'faqs', saved.id, {
        question: saved.question,
      });
      toast.success('FAQ tersimpan.');
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
      await deleteRow('faqs', confirm.id);
      await logActivity('delete', 'faqs', confirm.id, { question: confirm.question });
      toast.success('FAQ dihapus.');
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row) => {
    try {
      await updateRow('faqs', row.id, { is_published: !row.is_published });
    } catch (err) {
      toast.error(err);
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
          <IconPlus size={15} /> FAQ Baru
        </Button>
      </div>

      <Card flush>
        {rows.length === 0 ? (
          <EmptyState title="Belum ada FAQ" text="Tambahkan pertanyaan yang sering ditanyakan." />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Urut</th>
                  <th>Pertanyaan</th>
                  <th>Halaman</th>
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
                      <div className="rf-td-title">{r.question}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--rf-soft)' }}>
                        {stripHtml(r.answer, 90)}
                      </div>
                    </td>
                    <td>
                      <Badge tone="accent">{r.page_slug}</Badge>
                    </td>
                    <td>
                      <Switch checked={r.is_published} onChange={() => toggle(r)} />
                    </td>
                    <td>{timeAgo(r.updated_at)}</td>
                    <td className="rf-td-actions">
                      <Button size="sm" onClick={() => setDraft({ ...r })}>
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
        title={draft?.id ? 'Edit FAQ' : 'FAQ Baru'}
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
            <Field label="Pertanyaan" required>
              <Input
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              />
            </Field>

            <Field label="Jawaban" required>
              <Textarea
                rows={5}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              />
            </Field>

            <div className="rf-grid-2">
              <Field label="Tampil di Halaman">
                <Select
                  value={draft.page_slug}
                  onChange={(e) => setDraft({ ...draft, page_slug: e.target.value })}
                >
                  {pages.rows.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Urutan">
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </Field>
            </div>

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
        title="Hapus FAQ"
        message={`FAQ "${confirm?.question}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
