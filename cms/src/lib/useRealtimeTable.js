import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isConfigured } from './supabase';

/**
 * Ambil isi tabel lalu jaga tetap sinkron lewat Supabase Realtime.
 * Perubahan dari tab/perangkat lain langsung tercermin tanpa refresh.
 */
export function useRealtimeTable(table, options = {}) {
  const {
    orderBy = 'sort_order',
    ascending = true,
    filterColumn,
    filterValue,
    limit,
    enabled = true,
  } = options;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const sortRef = useRef({ orderBy, ascending });
  sortRef.current = { orderBy, ascending };

  const sortRows = useCallback((list) => {
    const { orderBy: col, ascending: asc } = sortRef.current;
    return [...list].sort((a, b) => {
      const av = a?.[col];
      const bv = b?.[col];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return asc ? -1 : 1;
      return asc ? 1 : -1;
    });
  }, []);

  const fetchRows = useCallback(async () => {
    if (!isConfigured || !enabled) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let query = supabase.from(table).select('*').order(orderBy, { ascending, nullsFirst: false });
      if (filterColumn && filterValue != null) query = query.eq(filterColumn, filterValue);
      if (limit) query = query.limit(limit);
      const { data, error: err } = await query;
      if (err) throw err;
      setRows(data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [table, orderBy, ascending, filterColumn, filterValue, limit, enabled]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!isConfigured || !enabled) return undefined;

    const matchesFilter = (row) =>
      !filterColumn || filterValue == null || row?.[filterColumn] === filterValue;

    const channel = supabase
      .channel(`rt-${table}-${filterValue ?? 'all'}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === 'INSERT') {
            if (!matchesFilter(payload.new)) return prev;
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return sortRows([...prev, payload.new]);
          }
          if (payload.eventType === 'UPDATE') {
            if (!matchesFilter(payload.new)) {
              return prev.filter((r) => r.id !== payload.new.id);
            }
            const exists = prev.some((r) => r.id === payload.new.id);
            const next = exists
              ? prev.map((r) => (r.id === payload.new.id ? payload.new : r))
              : [...prev, payload.new];
            return sortRows(next);
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((r) => r.id !== payload.old.id);
          }
          return prev;
        });
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue, enabled, sortRows]);

  return { rows, setRows, loading, error, live, refresh: fetchRows };
}
