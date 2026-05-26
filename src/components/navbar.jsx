// Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Menu,
  X,
  LogIn,
  UserCircle2,
} from "lucide-react";

import { Button } from "../components/ui/button";

// Fake auth example
const useAuth = () => ({
  user: null,
  // user: { name: "أحمد بن علي" },
});

function UserPill({ user }) {
  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
          {user.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </div>

        <span className="text-sm font-semibold text-slate-800">
          {user.name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <UserCircle2 className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-500">
        زائر
      </span>

      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
              ZeroKen
            </h1>

            <p className="text-xs text-slate-400">
              منصة مدارس الدعم
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">

          <Link to="/">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-600 text-sm"
            >
              الرئيسية
            </Button>
          </Link>

          <Link to="/schools">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-600 text-sm"
            >
              تصفح المدارس
            </Button>
          </Link>

          <Link to="/schoolregister">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-600 text-sm"
            >
              سجّل مدرستك
            </Button>
          </Link>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          <UserPill user={user} />

          {!user && (
            <Link to="/login">
              <Button className="h-9 rounded-xl bg-blue-600 px-4 text-sm hover:bg-blue-700 gap-1.5">
                <LogIn className="h-4 w-4" />
                تسجيل الدخول
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-2 px-6 py-5">

              <Link to="/" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl"
                >
                  الرئيسية
                </Button>
              </Link>

              <Link to="/schools" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl"
                >
                  تصفح المدارس
                </Button>
              </Link>

              <Link to="/schoolregister" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl"
                >
                  سجّل مدرستك
                </Button>
              </Link>

              <div className="my-2 h-px bg-slate-200" />

              <UserPill user={user} />

              {!user && (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                >
                  <Button className="mt-3 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                    <LogIn className="mr-2 h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}