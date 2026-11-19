import { useEffect, useState } from "react";
import api from "../../api";

export default function useSchoolDetails(id, user) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  const [enrolledIds, setEnrolledIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [pendingCourseIds, setPendingCourseIds] = useState([]);

  // School detail
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    api.get(`/api/schools/${id}/detail`)
      .then((res) => {
        if (cancelled) return;
        setSchool(res.data);
        const days = Object.keys(res.data.modulesByDay || {});
        const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
        setActiveDay(days.includes(today) ? today : days[0] || null);
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  // Student enrollments
  useEffect(() => {
    if (user?.role !== "STUDENT") return;
    api.get(`/api/enrollments/accepted/${id}`)
      .then((res) => setEnrolledIds(res.data.map((e) => e.moduleId)))
      .catch(() => {});
    api.get(`/api/enrollments/pending/${id}`)
      .then((res) => setPendingIds(res.data.map((e) => e.moduleId)))
      .catch(() => {});
  }, [id, user?.role]);

  // Courses (events)
  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    api.get("/api/courses/browse", { params: { schoolId: id, level: "" } })
      .then((res) => !cancelled && setCourses(res.data || []))
      .catch(() => !cancelled && setCourses([]))
      .finally(() => !cancelled && setCoursesLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  return {
    school, loading, notFound, activeDay, setActiveDay,
    enrolledIds, pendingIds, setPendingIds,
    courses, coursesLoading,
    enrolledCourseIds, setEnrolledCourseIds,
    pendingCourseIds, setPendingCourseIds,
  };
}