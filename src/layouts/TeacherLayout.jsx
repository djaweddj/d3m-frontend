import Sidebarteacher from "../components/sidbebarteacher"
import { Outlet } from "react-router-dom"

export default function TeacherLayout() {
  return (
    <div dir="rtl" className="flex min-h-screen bg-[#fafafa]">
      <Sidebarteacher />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}