import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";

const requestsApi = {
  getPending: () => api.get("api/enrollments/requests", { params: { status: "PENDING" } }),
  approve: (id) => api.post(`api/enrollments/requests/${id}/approve`),
  reject: (id, comment) => api.post(`api/enrollments/requests/${id}/reject`, null, { params: { comment } }),
};

export default function useEnrollmentRequests(t) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const tRef = useRef(t);
  tRef.current = t;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestsApi.getPending();
      setRequests(res.data?.content ?? res.data ?? []);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 404 || status === 403
          ? tRef.current("requests.errors.noEndpoint")
          : err?.response?.data?.message || tRef.current("requests.errors.generic")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Both actions resolve to true / false so the page can react to a failure
  const approve = async (id) => {
    setApprovingId(id);
    try {
      await requestsApi.approve(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "ACTIVE" } : r)));
      return true;
    } catch {
      return false;
    } finally {
      setApprovingId(null);
    }
  };

  const reject = async (id, comment) => {
    try {
      await requestsApi.reject(id, comment);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "REJECTED", reviewComment: comment || r.reviewComment } : r))
      );
      return true;
    } catch {
      return false;
    }
  };

  return { requests, loading, error, approvingId, reload: load, approve, reject };
}