import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";


import { AuthProvider } from "./context/authContext";

// Layouts
import GuestLayout from "./layouts/GuestLayout";
import DashboardLayout from "./layouts/Dashboardlayout";
import TeacherLayout from "./layouts/TeacherLayout";



// Guest Pages
import Home from "./pages/Home";
import BrowseSchools from "./pages/BrowseSchools";
import SchoolDetails from "./pages/SchoolDetails";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import SchoolRegister from "./pages/SchoolRegister";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import StudentDashboard from "./pages/StudentDashboard";
import Requests from "./pages/Requests";
// teacherdashboard
import TeacherDashboard from "./pages/teacherDashboard";
import MyStudents from "./pages/MyStudent";
import TeacherProfile from "./pages/teacherprofile";
import ProtectedRoute from "./auth/ProtectedRoutes";

// Load Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap";
document.head.appendChild(link);

// Load Chart.js
const script = document.createElement("script");
script.src =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
document.head.appendChild(script);

export default function App() {
  return (
    <AuthProvider>
   
        <Toaster position="top-center" richColors />

        <Routes>
          {/* Redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Guest Layout (Navbar pages) */}
          <Route element={<GuestLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/schools" element={<BrowseSchools />} />
            <Route path="/schools/:id" element={<SchoolDetails />} />
          </Route>

          {/* Auth Pages (without layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/schoolregister" element={<SchoolRegister />} />

           <Route path="/studentdashboard" element={<StudentDashboard />} />
           {/* Dashboard teacher layout */} 
          <Route element={<TeacherLayout/>}>
          <Route path="/teacherdashboard" element={<TeacherDashboard />} />
           <Route path="/mystudent" element={<MyStudents/>} />
           <Route path="/teacherprofile" element={<TeacherProfile/>} />
           </Route>
          
              <Route path="/studentdashboard" element={
                <ProtectedRoute role={"STUDENT"}>
                    <StudentDashboard />
                </ProtectedRoute>
              
                } />
         
         


          {/* Dashboard Layout */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/requests" element={<Requests />} />
          </Route>
        </Routes>
  
    </AuthProvider>
  );
}