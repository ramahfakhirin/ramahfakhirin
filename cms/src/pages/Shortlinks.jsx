import { useEffect, useState } from 'react';
import { useToast } from '../lib/ToastContext';
import { listShortlinks, createShortlink, deleteShortlink, updateShortlink } from '../lib/api';
import { Button, Input } from '../components/ui';
import { IconCopy, IconTrash, IconPlus, IconLoader } from '../components/Icons';

export default function Shortlinks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadShortlinks();
  }, []);

  async function loadShortlinks() {
    try {
      setLoading(true);
      const data = await listShortlinks();
      setItems(data);
    } catch (err) {
      toast.error('Gagal memuat shortlinks: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function validateCode(code) {
    if (!code.trim()) {
      setCodeError('Shortcode tidak boleh kosong');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(code)) {
      setCodeError('Hanya huruf kecil, angka, dan dash (-) yang diperbolehkan');
      return false;
    }
    if (code.length < 3 || code.length > 50) {
      setCodeError('Shortcode harus 3-50 karakter');
      return false;
    }
    setCodeError('');
    return true;
  }

  async function handleCreate() {
    if (!newUrl.trim()) {
      toast.error('URL tidak boleh kosong');
      return;
    }
    if (!validateCode(newCode)) {
      return;
    }

    try {
      setCreating(true);
      const link = await createShortlink(newUrl, newCode.toLowerCase().trim());
      setItems([link, ...items]);
      setNewUrl('');
      setNewCode('');
      setCodeError('');
      toast.success('Shortlink berhasil dibuat');
    } catch (err) {
      if (err.message?.includes('duplicate') || err.message?.includes('23505')) {
        setCodeError('Shortcode sudah digunakan, pilih yang lain');
        toast.error('Shortcode sudah ada');
      } else {
        toast.error('Gagal membuat shortlink: ' + err.message);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus shortlink ini?')) return;

    try {
      await deleteShortlink(id);
      setItems(items.filter(item => item.id !== id));
      toast.success('Shortlink dihapus');
    } catch (err) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  }

  function copyToClipboard(code) {
    const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const shortUrl = `${baseUrl}/s/${code}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success('Copied: ' + shortUrl);
  }

  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="rf-page">
      <div className="rf-section">
        <div className="rf-section-header">
          <h2>Buat Shortlink Baru</h2>
          <p>Buat link pendek untuk membagikan portfolio atau URL panjang lainnya</p>
        </div>

        <div className="rf-form-group" style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label className="rf-label">URL Lengkap</label>
            <Input
              type="url"
              placeholder="https://ramahfakhirin.com/portfolio/project-1"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={creating}
            />
          </div>
          <div>
            <label className="rf-label">Shortcode</label>
            <Input
              type="text"
              placeholder="portfolio-2025 (huruf kecil, angka, dash)"
              value={newCode}
              onChange={(e) => {
                setNewCode(e.target.value);
                setCodeError('');
              }}
              disabled={creating}
              style={{ borderColor: codeError ? '#ff4444' : undefined }}
            />
            {codeError && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ff4444' }}>{codeError}</p>}
          </div>
          <Button onClick={handleCreate} disabled={creating || !newUrl.trim() || !newCode.trim()}>
            {creating ? <IconLoader size={16} /> : <IconPlus size={16} />}
            {creating ? 'Membuat...' : 'Buat Shortlink'}
          </Button>
        </div>
      </div>

      <div className="rf-section">
        <div className="rf-section-header">
          <h2>Daftar Shortlinks</h2>
          <p>{items.length} shortlink aktif</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <IconLoader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p>Memuat...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Belum ada shortlink. Buat yang pertama di atas.
          </div>
        ) : (
          <div className="rf-table-wrapper">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Shortcode</th>
                  <th>URL Asli</th>
                  <th>Klik</th>
                  <th>Dibuat</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {item.code}
                      </code>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      <a href={item.full_url} target="_blank" rel="noopener noreferrer" title={item.full_url}>
                        {item.full_url}
                      </a>
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: 500, color: '#7463ff' }}>{item.clicks || 0}</td>
                    <td style={{ fontSize: '12px', color: '#999' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button
                        size="icon"
                        onClick={() => copyToClipboard(item.code)}
                        title="Salin shortlink"
                      >
                        <IconCopy size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="danger"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .rf-section {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .rf-section-header {
          margin-bottom: 20px;
        }

        .rf-section-header h2 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
        }

        .rf-section-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .rf-form-group {
          display: grid;
          gap: 12px;
        }

        .rf-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
        }

        .rf-table-wrapper {
          overflow-x: auto;
        }

        .rf-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .rf-table th {
          background: #f9f9f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e0e0e0;
        }

        .rf-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .rf-table td a {
          color: #7463ff;
          text-decoration: none;
        }

        .rf-table td a:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
