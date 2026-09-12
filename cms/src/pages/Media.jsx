import { useRef, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { deleteImage, uploadImage } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { formatDate } from '../lib/utils';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Loading,
  Modal,
} from '../components/ui';
import { IconCopy, IconTrash, IconUpload } from '../components/Icons';

function humanSize(bytes) {
  if (!bytes) return '—';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

export default function Media() {
  const { rows, loading, error, live } = useRealtimeTable('media', {
    orderBy: 'created_at',
    ascending: false,
  });
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const upload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);
    try {
      for (const file of list) {
        // sekuensial supaya pesan error per file jelas
        // eslint-disable-next-line no-await-in-loop
        await uploadImage(file, 'library');
      }
      toast.success(`${list.length} file berhasil diunggah.`);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteImage(confirm.path);
      toast.success('File dihapus.');
      setConfirm(null);
      setPreview(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL disalin.');
    } catch {
      toast.error('Gagal menyalin URL.');
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
        <Button variant="primary" onClick={() => inputRef.current?.click()} loading={busy}>
          <IconUpload size={15} /> Unggah Gambar
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      <Card subtitle={`${rows.length} file di bucket cms-media`}>
        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada file"
            text="Unggah gambar untuk dipakai di halaman website."
            action={
              <Button variant="primary" onClick={() => inputRef.current?.click()}>
                <IconUpload size={15} /> Unggah Gambar
              </Button>
            }
          />
        ) : (
          <div className="rf-media-grid">
            {rows.map((m) => (
              <div className="rf-media-item" key={m.id} onClick={() => setPreview(m)}>
                <img src={m.url} alt={m.alt || m.file_name} loading="lazy" />
                <div className="rf-media-name">{m.file_name || m.path}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(preview)}
        title={preview?.file_name || 'Detail File'}
        onClose={() => setPreview(null)}
        footer={
          preview && (
            <>
              <Button variant="danger" onClick={() => setConfirm(preview)}>
                <IconTrash size={15} /> Hapus
              </Button>
              <div className="rf-spacer" />
              <Button variant="primary" onClick={() => copy(preview.url)}>
                <IconCopy size={15} /> Salin URL
              </Button>
            </>
          )
        }
      >
        {preview && (
          <>
            <img
              src={preview.url}
              alt=""
              style={{
                width: '100%',
                borderRadius: 'var(--rf-radius-sm)',
                border: '1px solid var(--rf-bdr)',
                marginBottom: 18,
              }}
            />
            <div className="rf-grid-2">
              <div className="rf-field">
                <div className="rf-label">Ukuran</div>
                <div>{humanSize(preview.size_bytes)}</div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Tipe</div>
                <div>{preview.mime_type || '—'}</div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Diunggah</div>
                <div>{formatDate(preview.created_at, true)}</div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Path</div>
                <div style={{ wordBreak: 'break-all', fontSize: 13 }}>{preview.path}</div>
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Hapus File"
        message={`File "${confirm?.file_name || confirm?.path}" akan dihapus permanen dari storage. Halaman yang memakai gambar ini akan menampilkan gambar rusak. Lanjutkan?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
}
