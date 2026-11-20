import { useCallback, useEffect, useState } from "react";

// Calls an API function once on mount. Returns { data, loading, error, reload }.
export default function useFetch(fetchFn, fallbackMsg = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data?.content ?? res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || fallbackMsg || "Error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// Runs an async loader again whenever `key` changes (for data derived from other data).
// Failures fall back to `initial` instead of blocking the page.
export function useAsync(loader, key, initial) {
  const [state, setState] = useState({ data: initial, loading: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loader()
      .catch(() => initial)
      .then((data) => { if (alive) setState({ data, loading: false }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { ...state, error: null, reload: () => setTick((n) => n + 1) };
}
