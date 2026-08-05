import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, AlertCircle, Mail, Phone, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

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
  primary: "#0F5A46", // Deep Emerald
  primaryDark: "#0A4335",
  secondary: "#C8A24B", // Royal Gold
  accent: "#C53030", // Algerian Red
  background: "#FAFAF7", // Warm Off White
  textDark: "#1C231F", // near-black with a warm/green cast, for headings
  textBody: "#3F4A45", // dark slate-green for body text
  textMuted: "#5B6660", // still readable, for secondary meta text
};

function Badge({ status, t }) {
  const STATUS_KEYS = {
    ACTIVE: { color: COLORS.primary, bg: "#e4f0ec" },
    TRIAL: { color: "#8A6A21", bg: "#f7ecd4" },
    EXPIRED: { color: COLORS.accent, bg: "#fbe4e4" },
    SUSPENDED: { color: "#4B5563", bg: "#eceeef" },
  };
  const s = STATUS_KEYS[status] || { color: COLORS.primary, bg: "#e4f0ec" };
  const label = STATUS_KEYS[status] ? t(`browseSchools.status.${status}`) : status;
  return (
    <span
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}
      className="rounded-full px-3 py-1 text-xs font-semibold"
    >
      {label}
    </span>
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
    <div dir={dir} className="min-h-screen font-sans" style={{ background: `linear-gradient(to bottom, ${COLORS.background}, #ffffff)` }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(120deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 55%, #1C8A6C 100%)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 left-10 h-40 w-40 rounded-full blur-3xl" style={{ background: COLORS.secondary }} />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full blur-3xl" style={{ background: "#1C8A6C" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-24">
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 text-3xl font-extrabold text-white sm:mb-5 sm:text-4xl md:text-6xl"
            style={{ letterSpacing: "-0.025em", lineHeight: 1.15, textShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
          >
            {t("browseSchools.hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mx-auto mb-8 max-w-2xl text-sm font-normal leading-7 text-white/90 sm:mb-10 sm:text-base sm:leading-8 md:text-lg"
            style={{ letterSpacing: "0.01em" }}
          >
            {t("browseSchools.hero.subtitle")}
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="mx-auto max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:gap-3 sm:p-4">
              <Search className="h-5 w-5 shrink-0" style={{ color: COLORS.textMuted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("browseSchools.hero.searchPlaceholder")}
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-base md:text-lg"
                style={{ color: COLORS.textDark }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schools */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Top */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl" style={{ color: COLORS.textDark }}>
              {t("browseSchools.availableTitle")}
            </h2>
            <p className="mt-1 text-sm font-medium" style={{ color: COLORS.textMuted }}>
              {loading ? t("browseSchools.loading") : t("browseSchools.resultCount", { count: filtered.length })}
            </p>
          </div>
        </div>

        {/* Wilaya filter */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <FormControl
            size="small"
            fullWidth
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              width: { xs: "100%", sm: "auto" },
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
              MenuProps={{ PaperProps: { style: { maxHeight: 360 } } }}
            >
              {WILAYAS.map((w) => (
                <MenuItem key={w} value={w}>
                  {w}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {wilaya && (
            <Chip
              label={wilaya}
              onDelete={clearWilaya}
              deleteIcon={<ClearIcon />}
              sx={{
                bgcolor: "#e4f0ec",
                color: COLORS.primary,
                fontWeight: 600,
                border: `1px solid ${COLORS.primary}33`,
                maxWidth: "100%",
              }}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-8 flex items-center gap-3 rounded-2xl border p-4"
            style={{ borderColor: `${COLORS.accent}44`, background: "#fbe4e4", color: COLORS.accent }}
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 sm:h-80" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center shadow-sm sm:py-20">
            <Building2 className="mx-auto mb-4 h-12 w-12" style={{ color: COLORS.textMuted, opacity: 0.5 }} />
            <p className="text-lg font-semibold" style={{ color: COLORS.textDark }}>
              {t("browseSchools.emptyTitle")}
            </p>
            <p className="mt-2 text-sm" style={{ color: COLORS.textMuted }}>
              {t("browseSchools.emptySubtitle")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3">
              {filtered.map((school, index) => (
                <motion.div
                  key={school.schoolId}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-2xl"
                >
                  {/* Image — fills the box, cropped/centered, with graceful fallback */}
                  <div
                    className="relative h-40 w-full overflow-hidden sm:h-48"
                    style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
                  >
                    {school.logoUrl ? (
                      <img
                        src={school.logoUrl}
                        alt={school.schoolName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ display: school.logoUrl ? "none" : "flex" }}
                    >
                      <Building2 className="h-12 w-12 text-white/60 sm:h-14 sm:w-14" />
                    </div>
                    {/* subtle bottom shade for polish / future overlay text */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/15 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="mb-1 text-lg font-bold sm:text-xl" style={{ color: COLORS.textDark }}>
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

                    <div className="mb-4 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                      <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.primary }} />
                      <span>{school.phone}</span>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      <div className="space-y-1">
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
                        className="w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition sm:w-auto"
                        style={{
                          background: COLORS.primary,
                          boxShadow: `0 10px 15px -3px ${COLORS.primary}33`,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.primaryDark)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.primary)}
                      >
                        {t("browseSchools.card.viewDetails")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination (only relevant when a wilaya is selected, since that's the paginated server call) */}
            {wilaya && totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  style={{ color: COLORS.textBody }}
                >
                  {t("browseSchools.pagination.prev") || "Prev"}
                </button>
                <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  style={{ color: COLORS.textBody }}
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