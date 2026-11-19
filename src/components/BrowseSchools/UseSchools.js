import { useEffect, useRef, useState } from "react";
import api from "../../api";

/**
 * Loads schools for the browse page.
 *
 * Works with BOTH backend shapes so the page never breaks:
 *  - Spring Page  { content, totalElements } -> serverPaged = true  (one page per request)
 *  - Plain array                             -> serverPaged = false (page slices client-side)
 *
 * The unfiltered request now sends ?page&size too. If the backend honours them,
 * the page is server-paginated automatically; if it ignores them, the full list is
 * fetched once, cached, and paginated in the browser.
 */
export default function useSchools({ wilaya, page, pageSize }) {
  const [data, setData] = useState({ items: [], total: 0, serverPaged: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const allCache = useRef(null); // full unfiltered list when the API is not paginated

  useEffect(() => {
    if (!wilaya && allCache.current) {
      setData({ items: allCache.current, total: allCache.current.length, serverPaged: false });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const request = wilaya
      ? api.get("/api/schools/browse/wilaya", { params: { wilaya, page, size: pageSize } })
      : api.get("/api/schools/browse", { params: { page, size: pageSize } });

    request
      .then((res) => {
        if (cancelled) return;
        const body = res.data;
        if (Array.isArray(body)) {
          if (!wilaya) allCache.current = body;
          setData({ items: body, total: body.length, serverPaged: false });
        } else {
          const content = body?.content ?? body?.data ?? [];
          setData({ items: content, total: body?.totalElements ?? content.length, serverPaged: true });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [wilaya, page, pageSize]);

  return { ...data, loading, error };
}