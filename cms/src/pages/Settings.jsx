import { useEffect, useMemo, useState } from 'react';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { saveSetting } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { supabase } from '../lib/supabase';
import { Alert, Button, Card, Field, Input, Loading, Textarea } from '../components/ui';

const GROUP_LABEL = {
  general: 'Umum',
  contact: 'Kontak & Sosial Media',
  seo: 'SEO & Meta',
  private: 'Internal',
};

const isPlainString = (v) => typeof v === 'string';

export default function Settings() {
  const { rows, loading, error, live } = useRealtimeTable('settings', {
    orderBy: 'group',
    ascending: true,
  });
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState({ next: '', confirm: '' });
  const [pwdBusy, setPwdBusy] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      rows.forEach((r) => {
        if (next[r.key] === undefined) {
          next[r.key] = isPlainString(r.value) ? r.value : JSON.stringify(r.value, null, 2);
        }
      });
      return next;
    });
  }, [rows]);

  const grouped = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const g = r.group || 'general';
      (map[g] ||= []).push(r);
    });
    return map;
  }, [rows]);

  const saveAll = async () => {
    setBusy(true);
    try {
      for (const row of rows) {
        const raw = values[row.key];
        let parsed;
        if (isPlainString(row.value)) {
          parsed = raw;
        } else {
          try {
            parsed = JSON.parse(raw);
          } catch {
            throw new Error(`Format JSON tidak valid pada "${row.label || row.key}".`);
          }
        }
        // eslint-disable-next-line no-await-in-loop
        await saveSetting(row.key, parsed, { label: row.label, group: row.group });
      }
      toast.success('Pengaturan tersimpan.');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (pwd.next.length < 8) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    setPwdBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: pwd.next });
      if (err) throw err;
      setPwd({ next: '', confirm: '' });
      toast.success('Password berhasil diubah.');
    } catch (err) {
      toast.error(err);
    } finally {
      setPwdBusy(false);
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
        <Button variant="primary" onClick={saveAll} loading={busy}>
          Simpan Semua
        </Button>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <Card key={group} title={GROUP_LABEL[group] || group}>
          {items.map((row) => {
            const plain = isPlainString(row.value);
            return (
              <Field
                key={row.key}
                label={row.label || row.key}
                hint={plain ? `Kunci: ${row.key}` : `Kunci: ${row.key} — format JSON`}
              >
                {plain ? (
                  <Input
                    value={values[row.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [row.key]: e.target.value })}
                  />
                ) : (
                  <Textarea
                    code
                    rows={5}
                    value={values[row.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [row.key]: e.target.value })}
                  />
                )}
              </Field>
            );
          })}
        </Card>
      ))}

      <Card title="Akun" subtitle={user?.email}>
        <div className="rf-grid-2">
          <Field label="Password Baru" hint="Minimal 8 karakter">
            <Input
              type="password"
              value={pwd.next}
              autoComplete="new-password"
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            />
          </Field>
          <Field label="Ulangi Password Baru">
            <Input
              type="password"
              value={pwd.confirm}
              autoComplete="new-password"
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </Field>
        </div>
        <Button onClick={changePassword} loading={pwdBusy} disabled={!pwd.next}>
          Ubah Password
        </Button>
      </Card>
    </>
  );
}
