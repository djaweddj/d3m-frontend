import { BookOpen, CalendarDays, GraduationCap, School, User } from "lucide-react";
import CoursesPage from "../../pages/CoursesPage";
import ProfilePage from "../../pages/ProfilePage";
import SchedulePage from "../../pages/SchedulePage";
import SchoolsPage from "../../pages/SchoolsPage";
import SessionsPage from "../../pages/SessionsPage";

const list = (r, key) => r[key].data ?? [];

// Single source of truth for the dashboard:
//   path   -> route URL (flat, like /teacherhome)
//   icon   -> sidebar / tab bar
//   needs  -> resources that must be loaded (and error-free) before the page renders
//   render -> receives all resources
export const STUDENT_PAGES = {
  sessions: {
    path: "/studentsessions",
    icon: BookOpen,
    needs: ["enrollments", "invoices", "sessions", "modules"],
    render: (r) => (
      <SessionsPage
        sessions={list(r, "sessions")}
        enrollments={list(r, "enrollments")}
        invoices={list(r, "invoices")}
        moduleMap={r.modules.data}
      />
    ),
  },
  schedule: {
    path: "/studentschedule",
    icon: CalendarDays,
    needs: ["enrollments", "modules"],
    render: (r) => <SchedulePage enrollments={list(r, "enrollments")} moduleMap={r.modules.data} />,
  },
  schools: {
    path: "/studentschools",
    icon: School,
    needs: ["enrollments", "invoices"],
    render: (r) => (
      <SchoolsPage
        enrollments={list(r, "enrollments")}
        moduleMap={r.modules.data}
        invoices={list(r, "invoices")}
      />
    ),
  },
  profile: {
    path: "/studentprofile",
    icon: User,
    needs: ["profile", "enrollments", "modules"],
    render: (r) => (
      <ProfilePage
        profile={r.profile.data}
        enrollments={list(r, "enrollments")}
        moduleMap={r.modules.data}
        onSaved={r.profile.reload}
      />
    ),
  },
  courses: {
    path: "/studentcourses",
    icon: GraduationCap,
    needs: ["courseEnrollments", "courseInvoices"],
    render: (r) => (
      <CoursesPage
        courseEnrollments={list(r, "courseEnrollments")}
        courseInvoices={list(r, "courseInvoices")}
      />
    ),
  },
};

export const STUDENT_NAV = Object.entries(STUDENT_PAGES).map(([id, { icon, path }]) => ({ id, icon, path }));
