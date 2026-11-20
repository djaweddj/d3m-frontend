import api from "../../api";

export const teacherApi = {
  getAll: () => api.get("api/teachers"),
  getArchived: () => api.get("api/teachers/archived"),
  create: (data) => api.post("api/teachers/create", data),
  update: (id, data) => api.put(`api/teachers/${id}`, data),
  archive: (id) => api.patch(`api/teachers/${id}/archive`),
  unarchive: (id) => api.patch(`api/teachers/${id}/unarchive`),
  getSubjects: () => api.get("api/subjects"),

  getPayoutSummary: (period) => api.get("api/payouts", { params: { period } }),
  // Per-teacher: pays whatever is owed since the teacher's last payout
  payTeacherNow: (teacherId) => api.post(`api/payouts/teacher/${teacherId}/pay-now`),
  markPayoutPaid: (payoutId) => api.post(`api/payouts/${payoutId}/pay`),
  updatePercentage: (teacherId, value) => api.patch(`api/payouts/teacher/${teacherId}/percentage`, null, { params: { value } }),
  getLatestForTeacher: (teacherId) => api.get(`api/payouts/teacher/${teacherId}/latest`),
};
