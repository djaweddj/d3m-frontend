import { useState } from "react";
import { Ban } from "lucide-react";
import ConfirmModal from "../SchoolDetail/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

export default function RejectModal({ enrollment, onClose, onConfirm }) {
  const { t } = useLanguage();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(enrollment.id, comment);
    setLoading(false);
    onClose();
  };

  return (
    <ConfirmModal
      icon={Ban}
      title={t("requests.rejectModal.title")}
      description={enrollment.studentFullName}
      confirmLabel={t("requests.rejectModal.confirm")}
      confirmVariant="danger"
      cancelLabel={t("requests.rejectModal.cancel")}
      loadingLabel={t("requests.rejectModal.confirming")}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-green-deep/60">{t("requests.rejectModal.commentLabel")}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("requests.rejectModal.commentPlaceholder")}
          className="min-h-24 w-full resize-y rounded-sm border border-gold/40 bg-ivory p-3 text-start text-sm text-green-deep outline-none transition placeholder:text-green-deep/40 focus:border-gold focus:ring-2 focus:ring-gold/40"
        />
      </label>
    </ConfirmModal>
  );
}