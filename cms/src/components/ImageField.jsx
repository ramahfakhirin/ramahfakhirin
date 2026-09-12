import { useRef, useState } from 'react';
import { uploadImage } from '../lib/api';
import { useToast } from '../lib/ToastContext';
import { fixMediaUrl } from '../lib/fixMediaUrl';
import { Button, Field, Input } from './ui';
import { IconTrash, IconUpload } from './Icons';

export default function ImageField({ label = 'Gambar', value, onChange, folder = 'uploads', hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const toast = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(file, folder);
      onChange(url);
      toast.success('Gambar berhasil diunggah.');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="rf-preview">
          <img src={fixMediaUrl(value)} alt="" onError={(e) => { e.currentTarget.style.opacity = '.25'; }} />
          <div className="rf-preview-meta">
            <div className="rf-preview-name">{value}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button size="sm" onClick={() => inputRef.current?.click()} loading={busy}>
                Ganti
              </Button>
              <Button size="sm" variant="danger" onClick={() => onChange('')}>
                <IconTrash size={14} /> Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`rf-upload${drag ? ' is-drag' : ''}`}
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            {busy ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                <span className="rf-spinner is-dark" /> Mengunggah…
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                <IconUpload size={17} /> Klik atau seret gambar ke sini (maks 5 MB)
              </span>
            )}
          </div>
          <Input
            style={{ marginTop: 10 }}
            placeholder="atau tempel URL / path, contoh: assets/img/porto/1nanoyearbook.png"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </Field>
  );
}
