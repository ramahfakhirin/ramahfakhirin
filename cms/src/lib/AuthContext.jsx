import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, isConfigured } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async (userId) => {
    if (!userId || !supabase) return null;
    const { data } = await supabase.from('admins').select('*').eq('id', userId).maybeSingle();
    return data || null;
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAdmin(await loadAdmin(data.session?.user?.id));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      setAdmin(next ? await loadAdmin(next.user.id) : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAdmin]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const row = await loadAdmin(data.user.id);
    if (!row) {
      await supabase.auth.signOut();
      throw new Error(
        'Akun ini belum terdaftar sebagai admin. Tambahkan user ke tabel `admins` lebih dulu.'
      );
    }
    return data;
  }, [loadAdmin]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      admin,
      loading,
      isConfigured,
      isOwner: admin?.role === 'owner',
      signIn,
      signOut,
    }),
    [session, admin, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
