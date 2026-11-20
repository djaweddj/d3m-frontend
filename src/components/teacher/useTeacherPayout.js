import { useEffect, useRef, useState } from "react";
import { teacherApi } from "./teacherApi";
import { currentPeriod } from "./payouts";

// Payout state for one teacher inside the edit modal
export default function useTeacherPayout(teacherId, t, enabled) {
  const [period, setPeriod] = useState(currentPeriod());
  const [lastPayout, setLastPayout] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError("");
    teacherApi.getPayoutSummary(period)
      .then((res) => active && setLastPayout(res.data?.payouts?.find((p) => p.teacherId === teacherId) ?? null))
      .catch((err) => {
        if (!active) return;
        setLastPayout(null);
        setError(err?.response?.data?.message || tRef.current("teachers.payoutCard.loadError"));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [period, teacherId, enabled]);

  const markPaid = async () => {
    if (!lastPayout) return;
    setMarkingPaid(true);
    try {
      const res = await teacherApi.markPayoutPaid(lastPayout.id);
      setLastPayout(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || tRef.current("teachers.payoutCard.markPaidFailed"));
    } finally {
      setMarkingPaid(false);
    }
  };

  // Creates a payout for whatever is owed since the teacher's last payout
  const calculate = async () => {
    setCalculating(true);
    setError("");
    try {
      const res = await teacherApi.payTeacherNow(teacherId);
      setLastPayout(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || tRef.current("courses.payoutPanel.calculateFailed"));
    } finally {
      setCalculating(false);
    }
  };

  return { period, setPeriod, lastPayout, loading, error, markingPaid, calculating, markPaid, calculate };
}
