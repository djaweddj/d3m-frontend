import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, AlertCircle, Mail, Phone, Users, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";
import logo from "../assets/herologo.png"; // adjust path to match your existing logo import

const WILAYAS = [
  "01 - أدرار",
  "02 - الشلف",
  "03 - الأغواط",
  "04 - أم البواقي",
  "05 - باتنة",
  "06 - بجاية",
  "07 - بسكرة",
  "08 - بشار",
  "09 - البليدة",
  "10 - البويرة",
  "11 - تمنراست",
  "12 - تبسة",
  "13 - تلمسان",
  "14 - تيارت",
  "15 - تيزي وزو",
  "16 - الجزائر",
  "17 - الجلفة",
  "18 - جيجل",
  "19 - سطيف",
  "20 - سعيدة",
  "21 - سكيكدة",
  "22 - سيدي بلعباس",
  "23 - عنابة",
  "24 - قالمة",
  "25 - قسنطينة",
  "26 - المدية",
  "27 - مستغانم",
  "28 - المسيلة",
  "29 - معسكر",
  "30 - ورقلة",
  "31 - وهران",
  "32 - البيض",
  "33 - إليزي",
  "34 - برج بوعريريج",
  "35 - بومرداس",
  "36 - الطارف",
  "37 - تندوف",
  "38 - تيسمسيلت",
  "39 - الوادي",
  "40 - خنشلة",
  "41 - سوق أهراس",
  "42 - تيبازة",
  "43 - ميلة",
  "44 - عين الدفلى",
  "45 - النعامة",
  "46 - عين تموشنت",
  "47 - غرداية",
  "48 - غليزان",
  "49 - تيميمون",
  "50 - برج باجي مختار",
  "51 - أولاد جلال",
  "52 - بني عباس",
  "53 - عين صالح",
  "54 - عين قزام",
  "55 - توقرت",
  "56 - جانت",
  "57 - المغير",
  "58 - المنيعة",
  "59 - آفلو",
  "60 - بريكة",
  "61 - القنطرة",
  "62 - بئر العاتر",
  "63 - العريشة",
  "64 - قصر الشلالة",
  "65 - عين وسارة",
  "66 - مسعد",
  "67 - قصر البخاري",
  "68 - بوسعادة",
  "69 - الأبيض سيدي الشيخ",
];

// Brand palette
const COLORS = {
  primary: "#0F5A46",
  primaryDark: "#0A4335",
  primaryLight: "#1B7A61",
  secondary: "#C8A24B",
  accent: "#C53030",
  background: "#FAFAF7",
  textDark: "#1C231F",
  textBody: "#3F4A45",
  textMuted: "#667085",
  border: "#E5E7EB",
};

function Badge({ status, t }) {
  const STATUS_KEYS = {
    ACTIVE: { color: "#1B7A61", bg: "#E4F0EC", dot: "#1B7A61" },
    TRIAL: { color: "#8A6A21", bg: "#F7ECD4", dot: "#C8A24B" },
    EXPIRED: { color: COLORS.accent, bg: "#FBE4E4", dot: COLORS.accent },
    SUSPENDED: { color: "#4B5563", bg: "#ECEEEF", dot: "#4B5563" },
  };
  const s = STATUS_KEYS[status] || { color: COLORS.primary, bg: "#E4F0EC", dot: COLORS.primary };
  const label = STATUS_KEYS[status] ? t(`browseSchools.status.${status}`) : status;
  return (
    <span
      style={{ color: s.color, background: s.bg }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {label}
    </span>
  );
}

function ShimmerCard() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white">
      <div className="relative h-44 w-full overflow-hidden bg-[#EEF1EF]">
        <div className="shimmer-sweep" />
      </div>
      <div className="space-y-3 p-6">
        <div className="relative h-4 w-2/3 overflow-hidden rounded-full bg-[#EEF1EF]">
          <div className="shimmer-sweep" />
        </div>
        <div className="relative h-3 w-1/2 overflow-hidden rounded-full bg-[#EEF1EF]">
          <div className="shimmer-sweep" />
        </div>
        <div className="relative h-3 w-1/3 overflow-hidden rounded-full bg-[#EEF1EF]">
          <div className="shimmer-sweep" />
        </div>
        <div className="relative mt-4 h-10 w-full overflow-hidden rounded-2xl bg-[#EEF1EF]">
          <div className="shimmer-sweep" />
        </div>
      </div>
    </div>
  );
}

export default function BrowseSchools() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wilaya filter state
  const [wilaya, setWilaya] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  // Base (unfiltered) load — all schools
  useEffect(() => {
    if (wilaya) return; // wilaya effect below takes over
    setLoading(true);
    api
      .get("/api/schools/browse")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.content ?? res.data.data ?? [];
        setSchools(data);
      })
      .catch((err) => {
        console.error(err);
        setError(t("browseSchools.loadError"));
      })
      .finally(() => setLoading(false));
  }, [wilaya]);

  // Wilaya-filtered, server-side paginated load
  useEffect(() => {
    if (!wilaya) return;
    setLoading(true);
    setError(null);
    api
      .get("/api/schools/browse/wilaya", {
        params: { wilaya, page, size: pageSize },
      })
      .then((res) => {
        // Page<SchoolBrowseCardDto> shape: { content, totalElements, totalPages, ... }
        const body = res.data;
        const content = Array.isArray(body) ? body : body.content ?? [];
        setSchools(content);
        setTotalElements(Array.isArray(body) ? content.length : body.totalElements ?? content.length);
      })
      .catch((err) => {
        console.error(err);
        setError(t("browseSchools.loadError"));
      })
      .finally(() => setLoading(false));
  }, [wilaya, page]);

  const handleWilayaChange = (e) => {
    setPage(0);
    setWilaya(e.target.value);
  };

  const clearWilaya = () => {
    setPage(0);
    setWilaya("");
  };

  // Client-side text search still applies on top of whatever is currently loaded
  const filtered = schools.filter(
    (s) =>
      s.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
      s.wilaya?.toLowerCase().includes(search.toLowerCase()) ||
      s.commune?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  return (
    <div dir={dir} className="min-h-screen font-sans" style={{ background: COLORS.background, color: COLORS.textDark }}>
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: shimmerSweep 1.4s ease-in-out infinite;
        }
        @keyframes rotateLogo {
          0% { transform: rotate(0deg) scale(1); }
          100% { transform: rotate(360deg) scale(1.08); }
        }
        .logo-mark {
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .logo-mark:hover {
          animation: rotateLogo 0.7s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .search-shell {
          transition: box-shadow 0.35s ease, border-color 0.35s ease, transform 0.2s ease;
        }
        .search-shell:focus-within {
          border-color: ${COLORS.primaryLight};
          box-shadow: 0 0 0 4px rgba(27,122,97,0.18), 0 20px 40px -12px rgba(10,67,53,0.35);
        }
        .school-card {
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), 
                      box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.4s ease;
          border: 1px solid ${COLORS.border};
        }
        .school-card:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 32px 64px -16px rgba(15, 90, 70, 0.2), 
                      0 0 0 1px rgba(27, 122, 97, 0.12),
                      0 0 40px -10px rgba(27, 122, 97, 0.15);
          border-color: rgba(27, 122, 97, 0.25);
        }
        .school-card:hover .school-logo-wrap {
          transform: scale(1.15) rotate(8deg);
          box-shadow: 0 12px 28px -6px rgba(15, 90, 70, 0.25);
        }
        .school-logo-wrap {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
                      box-shadow 0.4s ease;
        }
        .school-logo-wrap img {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .school-card:hover .school-logo-wrap img {
          transform: scale(1.1) rotate(-5deg);
        }
        .cta-btn {
          transition: background-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        }
        .cta-btn:hover {
          background-color: ${COLORS.primaryDark} !important;
          transform: translateY(-2px);
          box-shadow: 0 14px 24px -8px rgba(15, 90, 70, 0.45);
        }
        .page-btn {
          transition: all 0.25s ease;
        }
      `}</style>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 55%, ${COLORS.primaryLight} 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <div className="absolute -top-16 -left-10 h-72 w-72 rounded-full blur-3xl" style={{ background: COLORS.secondary }} />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl" style={{ background: COLORS.primaryLight }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 sm:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-5 text-3xl font-extrabold text-white sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.15, textShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
          >
            {t("browseSchools.hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-10 max-w-xl text-sm font-normal leading-7 text-white/85 sm:text-base sm:leading-8"
          >
            {t("browseSchools.hero.subtitle")}
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mx-auto max-w-2xl"
          >
            <div
              className="search-shell flex items-center gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-2xl sm:p-5"
            >
              <Search className="h-5 w-5 shrink-0" style={{ color: COLORS.textMuted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("browseSchools.hero.searchPlaceholder")}
                aria-label={t("browseSchools.hero.searchPlaceholder")}
                className="w-full bg-transparent text-center text-sm font-medium outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-base"
                style={{ color: COLORS.textDark }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schools */}
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 sm:py-20">
        {/* Top */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl" style={{ color: COLORS.textDark, letterSpacing: "-0.01em" }}>
              {t("browseSchools.availableTitle")}
            </h2>
          </div>
          <p className="text-sm font-semibold" style={{ color: COLORS.secondary }}>
            {loading ? t("browseSchools.loading") : t("browseSchools.resultCount", { count: filtered.length })}
          </p>
        </div>

        {/* Wilaya filter bar */}
        <div
          className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 260 },
                width: { xs: "100%", sm: "auto" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.primary,
                },
                "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
              }}
            >
              <InputLabel id="wilaya-select-label">
                {t("browseSchools.wilaya") || "Wilaya"}
              </InputLabel>
              <Select
                labelId="wilaya-select-label"
                id="wilaya-select"
                value={wilaya}
                label={t("browseSchools.wilaya") || "Wilaya"}
                onChange={handleWilayaChange}
                MenuProps={{ PaperProps: { style: { maxHeight: 360, borderRadius: 14 } } }}
              >
                {WILAYAS.map((w) => (
                  <MenuItem key={w} value={w}>
                    {w}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <AnimatePresence>
              {wilaya && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
                  style={{ background: "#E4F0EC", color: COLORS.primary, border: `1px solid ${COLORS.primary}33` }}
                >
                  <span>{wilaya}</span>
                  <button
                    type="button"
                    onClick={clearWilaya}
                    aria-label={t("browseSchools.clearFilter") || "Clear filter"}
                    className="rounded-full p-0.5 hover:bg-black/5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 flex items-center gap-3 rounded-2xl border p-4"
              style={{ borderColor: `${COLORS.accent}33`, background: "#FBE4E4", color: COLORS.accent }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-[28px] border border-dashed bg-white px-6 py-20 text-center shadow-sm"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "#E4F0EC" }}
            >
              <Building2 className="h-10 w-10" style={{ color: COLORS.primary }} />
            </div>
            <p className="text-lg font-bold" style={{ color: COLORS.textDark }}>
              {t("browseSchools.emptyTitle")}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: COLORS.textMuted }}>
              {t("browseSchools.emptySubtitle")}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((school, index) => (
                <motion.div
                  key={school.schoolId}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
                  className="school-card overflow-hidden rounded-[28px] bg-white shadow-sm"
                >
                  <div className="p-6">
                    {/* Header: circular logo + status */}
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="school-logo-wrap flex h-16 w-16 items-center justify-center rounded-full shadow-sm"
                        style={{ background: "#EEF4F1" }}
                      >
                        {school.logoUrl ? (
                          <img
                            src={school.logoUrl}
                            alt={school.schoolName}
                            className="h-16 w-16 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="h-16 w-16 items-center justify-center rounded-full"
                          style={{ display: school.logoUrl ? "none" : "flex" }}
                        >
                          <Building2 className="h-7 w-7" style={{ color: COLORS.primary }} />
                        </div>
                      </div>
                      <Badge status={school.status} t={t} />
                    </div>

                    <h3 className="mb-1.5 text-lg font-bold sm:text-xl" style={{ color: COLORS.textDark }}>
                      {school.schoolName}
                    </h3>

                    <div className="mb-4 flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textBody }}>
                      <MapPin className="h-4 w-4 shrink-0" style={{ color: COLORS.primary }} />
                      <span className="truncate">{school.wilaya} - {school.commune}</span>
                    </div>

                    <div className="mb-1.5 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                      <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.primary }} />
                      <span className="truncate">{school.email}</span>
                    </div>

                    <div className="mb-5 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                      <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.primary }} />
                      <span>{school.phone}</span>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0" style={{ borderColor: COLORS.border }}>
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-sm font-bold" style={{ color: COLORS.primary }}>
                          <Users className="h-4 w-4" />
                          {t("browseSchools.card.teachersCount", { count: school.totalTeachers })}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm font-bold" style={{ color: COLORS.primary }}>
                          <BookOpen className="h-4 w-4" />
                          {t("browseSchools.card.modulesCount", { count: school.totalModules })}
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/schools/${school.schoolId}`)}
                        className="cta-btn w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg sm:w-auto"
                        style={{
                          background: COLORS.primary,
                          boxShadow: `0 10px 20px -6px ${COLORS.primary}55`,
                        }}
                      >
                        {t("browseSchools.card.viewDetails")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {wilaya && totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="page-btn rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: COLORS.border, color: COLORS.textBody }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#F3F6F4"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {t("browseSchools.pagination.prev") || "Prev"}
                </button>

                <span
                  className="rounded-xl px-4 py-2 text-sm font-bold text-white"
                  style={{ background: COLORS.primary }}
                >
                  {page + 1} / {totalPages}
                </span>

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="page-btn rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: COLORS.border, color: COLORS.textBody }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#F3F6F4"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {t("browseSchools.pagination.next") || "Next"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}