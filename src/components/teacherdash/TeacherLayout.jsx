import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ErrorNote } from "../../components/home/ui";
import TeacherSidebar from "./TeacherSidebar";
import { Loading } from "./teacherBits";
import { teacherApi } from "./api";
import useFetch from "./useFetch";

// Sidebar + page outlet. Pages read the profile with useOutletContext().
export default function TeacherLayout() {
  const { data, loading, error } = useFetch(teacherApi.profile, []);
  const [profile, setProfile] = useState(null);
  useEffect(() => { if (data) setProfile(data); }, [data]);

  return (
    <div dir="rtl" className="flex min-h-screen bg-canvas text-ink">
      <TeacherSidebar profile={profile} />

      <main className="min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-20 md:pt-6 lg:p-8">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="mx-auto max-w-md pt-16"><ErrorNote msg={error} /></div>
        ) : (
          <Outlet context={{ profile, setProfile }} />
        )}
      </main>
    </div>
  );
}