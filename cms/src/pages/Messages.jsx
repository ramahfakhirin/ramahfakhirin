import { useMemo, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteRow, updateRow } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { download, formatDate, timeAgo } from '../lib/utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Loading,
  Modal,
  Select,
} from '../components/ui';
import { IconSearch, IconTrash } from '../components/Icons';

const STATUS = {
  new: { label: 'Baru', tone: 'accent' },
  read: { label: 'Dibaca', tone: 'off' },
  replied: { label: 'Dibalas', tone: 'on' },
  archived: { label: 'Arsip', tone: 'warn' },
};

export default function Messages() {
  const { rows, loading, error, live } = useRealtimeTable('messages', {
    orderBy: 'created_at',
    ascending: false,
  });
  const [open, setOpen] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const toast = useToast();

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!term) return true;
      return [r.name, r.email, r.subject, r.message].some((v) =>
        String(v || '').toLowerCase().includes(term)
      );
    });
  }, [rows, filter, q]);

  const openMessage = async (row) => {
    setOpen(row);
    if (row.status === 'new') {
      try {
        await updateRow('messages', row.id, { status: 'read' });
      } catch {
        /* abaikan */
      }
    }
  };

  const setStatus = async (row, status) => {
    try {
      await updateRow('messages', row.id, { status });
      setOpen((prev) => (prev?.id === row.id ? { ...prev, status } : prev));
      toast.success('Status diperbarui.');
    } catch (err) {
      toast.error(err);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRow('messages', confirm.id);
      toast.success('Pesan dihapus.');
      setConfirm(null);
      setOpen(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const head = ['Tanggal', 'Nama', 'Email', 'Telepon', 'Subjek', 'Pesan', 'Status'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = filtered.map((r) =>
      [formatDate(r.created_at, true), r.name, r.email, r.phone, r.subject, r.message, r.status]
        .map(esc)
        .join(',')
    );
    download(`pesan-${Date.now()}.csv`, [head.join(','), ...body].join('\n'), 'text/csv');
  };

  if (loading) return <Loading />;

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="rf-toolbar">
        <div className="rf-search">
          <IconSearch />
          <Input placeholder="Cari pesan…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">Semua status</option>
          <option value="new">Baru</option>
          <option value="read">Dibaca</option>
          <option value="replied">Dibalas</option>
          <option value="archived">Arsip</option>
        </Select>
        <span className={`rf-live${live ? ' is-on' : ''}`}>
          <span className="rf-dot" />
          <span>{live ? 'Realtime aktif' : 'Menghubungkan…'}</span>
        </span>
        <div className="rf-spacer" />
        <Button onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </Button>
      </div>

      <Card flush>
        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada pesan"
            text="Submission dari form kontak akan muncul di sini secara realtime."
          />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Pengirim</th>
                  <th>Subjek</th>
                  <th>Status</th>
                  <th>Masuk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openMessage(r)}>
                    <td>
                      <div className="rf-td-title">{r.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--rf-soft)' }}>{r.email}</div>
                    </td>
                    <td style={{ maxWidth: 340 }}>
                      <div
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {r.subject || r.message}
                      </div>
                    </td>
                    <td>
                      <Badge tone={STATUS[r.status]?.tone || 'off'}>
                        {STATUS[r.status]?.label || r.status}
                      </Badge>
                    </td>
                    <td>{timeAgo(r.created_at)}</td>
                    <td className="rf-td-actions" onClick={(e) => e.stopPropagation()}>
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
        open={Boolean(open)}
        title="Detail Pesan"
        onClose={() => setOpen(null)}
        footer={
          open && (
            <>
              <Button variant="danger" onClick={() => setConfirm(open)}>
                <IconTrash size={15} /> Hapus
              </Button>
              <div className="rf-spacer" />
              <Button onClick={() => setStatus(open, 'archived')}>Arsipkan</Button>
              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = `mailto:${open.email}?subject=Re: ${encodeURIComponent(
                    open.subject || 'Pesan dari website'
                  )}`;
                  setStatus(open, 'replied');
                }}
              >
                Balas via Email
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <div className="rf-grid-2">
              <div className="rf-field">
                <div className="rf-label">Nama</div>
                <div>{open.name}</div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Email</div>
                <a href={`mailto:${open.email}`}>{open.email}</a>
              </div>
              <div className="rf-field">
                <div className="rf-label">Telepon</div>
                <div>{open.phone || '—'}</div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Masuk</div>
                <div>{formatDate(open.created_at, true)}</div>
              </div>
            </div>

            <div className="rf-field">
              <div className="rf-label">Subjek</div>
              <div>{open.subject || '—'}</div>
            </div>

            <div className="rf-field">
              <div className="rf-label">Pesan</div>
              <div
                style={{
                  background: 'var(--rf-bg2)',
                  border: '1px solid var(--rf-bdr)',
                  borderRadius: 'var(--rf-radius-sm)',
                  padding: '14px 16px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.65,
                }}
              >
                {open.message}
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus Pesan"
        message={`Pesan dari "${confirm?.name}" akan dihapus permanen. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
