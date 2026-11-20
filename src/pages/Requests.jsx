import { useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import useEnrollmentRequests from "../components/Requests/useEnrollmentRequests";
import NButton from "../components/home/NButton";
import EmptyState from "../components/BrowseSchools/EmptyState";
import Toast from "../components/SchoolDetail/Toast";
import PageToolbar from "../components/Requests/PageToolbar";
import SearchField from "../components/Requests/SearchField";
import FilterTabs from "../components/Requests/FilterTabs";
import IconButton from "../components/Requests/IconButton";
import RequestRow from "../components/Requests/RequestRow";
import RequestRowSkeleton from "../components/Requests/RequestRowSkeleton";
import RejectModal from "../components/Requests/RejectModal";

export default function Requests() {
  const { t, dir } = useLanguage();
  const { requests, loading, error, approvingId, reload, approve, reject } = useEnrollmentRequests(t);

  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showError = () => {
    clearTimeout(toastTimer.current);
    setToast({ message: t("requests.errors.generic"), type: "error" });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id) => { if (!(await approve(id))) showError(); };
  const handleReject = async (id, comment) => { if (!(await reject(id, comment))) showError(); };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byStatus = filter === "PENDING" ? requests.filter((r) => r.status === "PENDING") : requests;
    return q ? byStatus.filter((r) => (r.studentFullName ?? "").toLowerCase().includes(q)) : byStatus;
  }, [requests, filter, search]);

  const searching = search.trim().length > 0;

  return (
    <div dir={dir} className="min-h-screen bg-ivory px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageToolbar
          title={t("requests.title")}
          subtitle={loading ? "..." : t("requests.countPending", { count: pendingCount })}
        >
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t("requests.searchPlaceholder", "Search by student name...")}
          />
          <FilterTabs
            active={filter}
            onChange={setFilter}
            tabs={[
              { key: "PENDING", label: t("requests.filters.pending"), count: pendingCount },
              { key: "ALL", label: t("requests.filters.all") },
            ]}
          />
          <IconButton large icon={RefreshCw} label={t("requests.retry")} loading={loading} onClick={reload} />
        </PageToolbar>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, i) => <RequestRowSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center">
            <EmptyState icon={AlertCircle} tone="error" title={error} />
            <NButton type="button" variant="outline" onClick={reload} className="mt-6">
              <RefreshCw className="size-4" />
              {t("requests.retry")}
            </NButton>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={searching ? Search : CheckCircle2}
            title={
              searching
                ? t("requests.emptySearch", "No requests match that name")
                : filter === "PENDING" ? t("requests.emptyPending") : t("requests.emptyAll")
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((enrollment, i) => (
              <RequestRow
                key={enrollment.id}
                index={i}
                enrollment={enrollment}
                approving={approvingId === enrollment.id}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            enrollment={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <Toast key={toast.message} {...toast} />}</AnimatePresence>
    </div>
  );
}