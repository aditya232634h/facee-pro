import { useCallback, useEffect, useState } from 'react';
import { errMsg } from '../services/api.js';

// Loads data via `fn`; reloads when `deps` change. Never fakes success: surfaces real errors.
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn().then((r) => setState({ data: r.data, meta: r.meta || null, loading: false, error: null }))
      .catch((e) => setState({ data: null, meta: null, loading: false, error: errMsg(e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
