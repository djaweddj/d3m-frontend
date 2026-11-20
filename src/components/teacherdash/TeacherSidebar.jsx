import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, User, Users, CalendarDays, ClipboardCheck, Wallet,
  Home, LogOut, School, X, Menu,
} from "lucide-react";
import { Avatar, Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/home/ui";
import NButton from "../../components/home/NButton";
import { useAuth } from "../../context/authContext";

const NAV = [
  { to: "/teacherhome", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "teacherprofile", label: "بروفايلي", icon: User },
  { to: "/teacherstudents", label: "تلاميذي", icon: Users },
  { to: "/teacherschedule", label: "جدولي", icon: CalendarDays },
  { to: "/teacherattendance", label: "الحضور", icon: ClipboardCheck },
  { to: "/teacherpayouts", label: "مستحقاتي", icon: Wallet },
];

const item = "flex h-11 items-center gap-3 border-s-4 px-4 text-sm font-bold transition-colors";
const idle = "border-transparent text-ivory/65 hover:bg-ivory/5 hover:text-ivory";
const on = "border-gold bg-gold/15 text-gold";

// Everything navigation-related lives here: desktop sidebar, mobile top bar + drawer, logout confirm.
export default function TeacherSidebar({ profile }) {
  const { school, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const close = () => setOpen(false);
  const title = NAV.find((n) => pathname.startsWith(n.to))?.label;

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-green-deep px-4 text-ivory md:hidden">
        <button onClick={() => setOpen(true)} aria-label="فتح القائمة" className="grid size-9 place-items-center rounded-sm hover:bg-ivory/10">
          <Menu className="size-5" />
        </button>
        <span className="font-display text-sm">{title}</span>
        <span className="size-9" />
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[55] bg-green-deep/60 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        dir="rtl"
        className={`fixed right-0 top-0 z-[60] flex h-screen w-60 shrink-0 flex-col bg-green-deep text-ivory transition-transform duration-300 md:sticky md:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="nm-rule" />

        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm bg-ivory">
            {school?.logoUrl
              ? <img src={school.logoUrl} alt="" className="size-full object-cover" />
              : <School className="size-5 text-green-deep" strokeWidth={1.5} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm">{school?.schoolName || "المدرسة"}</p>
            <p className="text-xs text-ivory/50">لوحة الأستاذ</p>
          </div>
          <button onClick={close} aria-label="إغلاق القائمة" className="grid size-9 place-items-center rounded-sm text-ivory/60 hover:bg-ivory/10 hover:text-gold md:hidden">
            <X className="size-4" />
          </button>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-3 rounded-sm bg-ivory/5 p-3">
          <Avatar name={profile?.fullName || "أستاذ"} className="size-10 !bg-gold !text-green-deep" />
          <p className="truncate text-sm font-bold">{profile?.fullName || "أستاذ"}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pe-2">
          <Link to="/home" className={`${item} ${idle}`}>
            <Home className="size-4" strokeWidth={1.75} />
            الصفحة الرئيسية
          </Link>
          <div className="mx-4 my-2 h-px bg-ivory/10" />
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={close} className={({ isActive }) => `${item} ${isActive ? on : idle}`}>
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setConfirm(true)}
          className="m-4 flex h-11 items-center gap-3 rounded-sm px-4 text-sm font-bold text-ivory/60 transition-colors hover:bg-algeria-red/20 hover:text-ivory"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          تسجيل الخروج
        </button>
      </aside>

      {confirm && (
        <Modal dir="rtl" maxWidth="max-w-sm" onClose={() => setConfirm(false)}>
          <ModalHeader title="تسجيل الخروج" onClose={() => setConfirm(false)} />
          <ModalBody>
            <p className="text-sm text-green-deep/70">هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟</p>
          </ModalBody>
          <ModalFooter>
            <NButton onClick={doLogout} className="flex-1">تسجيل الخروج</NButton>
            <NButton variant="outline" onClick={() => setConfirm(false)} className="flex-1">إلغاء</NButton>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}