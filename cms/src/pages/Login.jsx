import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Alert, Button, Field, Input } from '../components/ui';

export default function Login() {
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rf-login">
      <form className="rf-login-box" onSubmit={submit}>
        <div className="rf-login-logo">
          Ramahf<span>.</span>
        </div>
        <div className="rf-login-sub">Masuk ke panel manajemen konten</div>

        {!isConfigured && (
          <Alert tone="error">
            Supabase belum dikonfigurasi. Salin <code>cms/.env.example</code> menjadi{' '}
            <code>cms/.env</code>, lalu isi <code>VITE_SUPABASE_URL</code> dan{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>.
          </Alert>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <Field label="Email" required>
          <Input
            type="email"
            value={email}
            autoComplete="username"
            placeholder="admin@ramahfakhirin.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Password" required>
          <Input
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" variant="primary" block loading={busy} disabled={!isConfigured}>
          Masuk
        </Button>
      </form>
    </div>
  );
}
