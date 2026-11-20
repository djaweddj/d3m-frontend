import { useCallback, useEffect, useRef, useState } from "react";
import { teacherApi } from "./teacherApi";

export default function useTeachers(t) {
  const [teachers, setTeachers] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [error, setError] = useState(null);
  const tRef = useRef(t);
  tRef.current = t;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, sRes] = await Promise.all([teacherApi.getAll(), teacherApi.getSubjects()]);
      setTeachers(tRes.data?.content ?? tRes.data ?? []);
      setSubjects(sRes.data?.content ?? sRes.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || tRef.current("teachers.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const res = await teacherApi.getArchived();
      setArchivedTeachers(res.data?.content ?? res.data ?? []);
    } catch {
      setArchivedTeachers([]);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Actions resolve to { ok, message?, data? } so the page decides how to notify
  const archive = async (id) => {
    try {
      await teacherApi.archive(id);
      setTeachers((prev) => prev.filter((x) => x.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || tRef.current("teachers.archiveFailed") };
    }
  };

  const unarchive = async (id) => {
    try {
      await teacherApi.unarchive(id);
      const restored = archivedTeachers.find((x) => x.id === id);
      setArchivedTeachers((prev) => prev.filter((x) => x.id !== id));
      if (restored) setTeachers((prev) => [{ ...restored, archived: false }, ...prev]);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || tRef.current("teachers.restoreFailed") };
    }
  };

  const payNow = async (id) => {
    try {
      const res = await teacherApi.payTeacherNow(id);
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || tRef.current("courses.payoutPanel.calculateFailed") };
    }
  };

  const addTeacher = (teacher) => setTeachers((prev) => [teacher, ...prev]);
  const updateTeacher = (updated) => setTeachers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

  return {
    teachers, archivedTeachers, subjects, loading, archivedLoading, error,
    load, loadArchived, archive, unarchive, payNow, addTeacher, updateTeacher,
  };
}
