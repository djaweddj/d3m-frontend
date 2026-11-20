import { useEffect, useState } from "react";

// One loading / error / data pattern for every page.
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !off && setState({ data, loading: false, error: null }))
      .catch((e) => !off && setState({ data: null, loading: false, error: e.message }));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
