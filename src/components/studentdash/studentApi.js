import api from "../../api";

export const studentApi = {
  getProfile: () => api.get("api/students/profile"),
  updateProfile: (data) => api.put("api/students/profile", data),
  getEnrollments: () => api.get("api/enrollments/mine"),
  getInvoices: () => api.get("api/invoices/mine"),
  getSessionsBySchool: (schoolId) => api.get(`api/sessions/school/${schoolId}`),
  browseModules: (schoolId, level) =>
    api.get("api/modules/browse", { params: { schoolId, level } }),
  getCourseEnrollments: () => api.get("api/courses/mine"),
  getCourseInvoices: () => api.get("api/courses/invoices/mine"),
};
