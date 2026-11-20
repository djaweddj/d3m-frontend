import { useCallback, useEffect, useRef, useState } from "react";
import { teacherApi } from "./teacherApi";

export default function usePayoutSummary(period, t) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const tRef = useRef(t);
  tRef.current = t;
  const latest = useRef(0);

  const load = useCallback(async (p) => {
    const id = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const res = await teacherApi.getPayoutSummary(p);
      if (id === latest.current) setSummary(res.data);
    } catch (err) {
      if (id !== latest.current) return;
      setSummary(null);
      setError(err?.response?.data?.message || tRef.current("courses.payoutsTab.summaryLoadError"));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const markPaid = async (payout) => {
    setMarkingId(payout.id);
    try {
      const res = await teacherApi.markPayoutPaid(payout.id);
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              payouts: prev.payouts.map((p) => (p.id === res.data.id ? res.data : p)),
              totalPayoutsPaid: (Number(prev.totalPayoutsPaid) || 0) + Number(res.data.payoutAmount || 0),
              totalPayoutsDue: Math.max(0, (Number(prev.totalPayoutsDue) || 0) - Number(res.data.payoutAmount || 0)),
            }
          : prev
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || tRef.current("teachers.payoutCard.markPaidFailed") };
    } finally {
      setMarkingId(null);
    }
  };

  return { summary, loading, error, markingId, reload: () => load(period), markPaid };
}
