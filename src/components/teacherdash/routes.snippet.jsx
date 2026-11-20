// In your router (replaces the old single <Route path="/teacher" element={<TeacherDashboard/>} />)
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherPayouts from "./pages/teacher/TeacherPayouts";

<Route path="/teacher" element={<TeacherLayout />}>
  <Route index element={<TeacherHome />} />
  <Route path="profile" element={<TeacherProfile />} />
  <Route path="students" element={<TeacherStudents />} />
  <Route path="schedule" element={<TeacherSchedule />} />
  <Route path="attendance" element={<TeacherAttendance />} />
  <Route path="payouts" element={<TeacherPayouts />} />
</Route>
