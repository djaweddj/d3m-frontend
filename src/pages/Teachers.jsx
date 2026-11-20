import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Archive, Plus, RefreshCw, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import useTeachers from "../components/teacher/useTeachers";
import { formatDA } from "../components/teacher/payouts";
import NButton from "../components/home/NButton";
import EmptyState from "../components/BrowseSchools/EmptyState";
import Toast from "../components/SchoolDetail/Toast";
import PageToolbar from "../components/Requests/PageToolbar";
import FilterTabs from "../components/Requests/FilterTabs";
import IconButton from "../components/Requests/IconButton";
import TeacherCard from "../components/SchoolDetail/TeacherCard";
import TeacherCardSkeleton from "../components/teacher/TeacherCardSkeleton";
import TeacherFormModal from "../components/teacher/TeacherFormModal";
import PayoutsTab from "../components/teacher/PayoutsTab";

export default function Teachers() {
  const { t, dir } = useLanguage();
  const data = useTeachers(t);

  const [activeTab, setActiveTab] = useState("teachers");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [confirmingPayId, setConfirmingPayId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const { loadArchived } = data;
  useEffect(() => { if (showArchived) loadArchived(); }, [showArchived, loadArchived]);

  const handleArchive = async (id) => {
    setActionId(id);
    const r = await data.archive(id);
    setActionId(null);
    if (!r.ok) notify(r.message, "error");
  };

  const handleUnarchive = async (id) => {
    setActionId(id);
    const r = await data.unarchive(id);
    setActionId(null);
    if (!r.ok) notify(r.message, "error");
  };

  // Pay a teacher whatever is owed since their last payout, straight from the card
  const handlePayNow = async (id) => {
    setPayingId(id);
    const r = await data.payNow(id);
    setPayingId(null);
    setConfirmingPayId(null);
    if (r.ok) {
      notify(t("teachers.payoutCard.payNowSuccess", { amount: formatDA(r.data?.payoutAmount, t("teacherDashboard.currency")) }));
    } else {
      notify(r.message, "error");
    }
  };

  const closeForm = () => { setFormOpen(false); setEditingTeacher(null); };
  const handleSaved = (saved) => (editingTeacher ? data.updateTeacher(saved) : data.addTeacher(saved));

  const subjectMap = Object.fromEntries(data.subjects.map((s) => [s.id, s.name]));
  const displayList = showArchived ? data.archivedTeachers : data.teachers;
  const listLoading = showArchived ? data.archivedLoading : data.loading;
  const isTeachersTab = activeTab === "teachers";

  return (
    <div dir={dir} className="min-h-screen bg-ivory px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PageToolbar
          title={t("sidebar.nav.teachers")}
          subtitle={isTeachersTab ? (data.loading ? "..." : t("teachers.countActive", { count: data.teachers.length })) : t("teacherDashboard.payouts.subtitle")}
        >
          <FilterTabs
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              { key: "teachers", label: t("sidebar.nav.teachers") },
              { key: "payouts", label: t("courses.tabs.payouts") },
            ]}
          />
          {isTeachersTab && (
            <>
              <IconButton large icon={RefreshCw} label={t("teachers.retry")} loading={listLoading} onClick={showArchived ? data.loadArchived : data.load} />
              <NButton type="button" variant={showArchived ? "danger" : "outline"} onClick={() => setShowArchived((v) => !v)}>
                <Archive className="size-4" />
                {showArchived ? t("teachers.hideArchived") : t("teachers.showArchived")}
              </NButton>
              {!showArchived && (
                <NButton type="button" onClick={() => setFormOpen(true)}>
                  <Plus className="size-4" />{t("teachers.addTeacher")}
                </NButton>
              )}
            </>
          )}
        </PageToolbar>

        {isTeachersTab ? (
          <>
            {showArchived && (
              <p className="mb-6 flex items-center gap-3 border border-algeria-red/30 bg-algeria-red/10 px-4 py-3 text-sm font-bold text-algeria-red">
                <Archive className="size-4 shrink-0" />{t("teachers.archivedBanner")}
              </p>
            )}

            {listLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => <TeacherCardSkeleton key={i} />)}
              </div>
            ) : data.error && !showArchived ? (
              <div className="text-center">
                <EmptyState icon={AlertCircle} tone="error" title={data.error} />
                <NButton type="button" variant="outline" onClick={data.load} className="mt-6">
                  <RefreshCw className="size-4" />{t("teachers.retry")}
                </NButton>
              </div>
            ) : displayList.length === 0 ? (
              <EmptyState icon={Users} title={showArchived ? t("teachers.emptyArchived") : t("teachers.emptyActive")} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayList.map((teacher, i) => (
                  <TeacherCard
                    key={teacher.id}
                    index={i}
                    teacher={teacher}
                    subjectName={subjectMap[teacher.subjectIds?.[0]]}
                    isArchived={showArchived}
                    busy={actionId === teacher.id}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    onEdit={setEditingTeacher}
                    confirmingPay={confirmingPayId === teacher.id}
                    paying={payingId === teacher.id}
                    onPayNow={setConfirmingPayId}
                    onConfirmPay={handlePayNow}
                    onCancelPay={() => setConfirmingPayId(null)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <PayoutsTab teachers={data.teachers} notify={notify} />
        )}
      </div>

      <AnimatePresence>
        {(formOpen || editingTeacher) && (
          <TeacherFormModal
            key={editingTeacher?.id ?? "new"}
            teacher={editingTeacher}
            subjects={data.subjects}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <Toast key={toast.message} {...toast} />}</AnimatePresence>
    </div>
  );
}