import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Check,
  Info,
  Pencil,
  Save,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import AdminLayout from "../components/layout/admin/AdminLayout";
import ToastNotification from "../components/common/ToastNotification";
import { useWorkflow } from "../context/WorkflowContext";
import { useUser } from "../context/UserContext";
import { useWorkflowResource } from "../hooks/useWorkflowResource";
import { useToastNotifications } from "../hooks/useToastNotifications";
import {
  money,
  WorkflowError,
  WorkflowModal,
} from "../components/features/workflow/WorkflowShared";
import type { MembershipTier } from "../types/workflow";
import common from "../components/features/workflow/Workflow.module.css";
import styles from "./MembershipConfigPage.module.css";

type TierDraft = Omit<MembershipTier, "minSpending" | "pointRate"> & {
  minSpending: string;
  pointRate: string;
};

export default function MembershipConfigPage() {
  const { api } = useWorkflow();
  const { user } = useUser();
  const load = useCallback(() => api.tiers(), [api]);
  const tiers = useWorkflowResource(load);
  const [draft, setDraft] = useState<TierDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const notifications = useToastNotifications();
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.updateTier({
        ...draft,
        minSpending: Number(draft.minSpending),
        pointRate: Number(draft.pointRate),
      });
      setDraft(null);
      tiers.reload();
      notifications.notify(
        "Đã lưu cấu hình hạng thành viên. Tỷ lệ mới áp dụng cho các đơn tiếp theo.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu cấu hình.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminLayout
      activePage="membership"
      title="Cấu hình hạng thành viên"
      subtitle="Thiết lập mốc chi tiêu, tỷ lệ tích điểm và quyền lợi cho từng hạng"
      badge="Chính sách thành viên"
    >
      <ToastNotification
        toasts={notifications.toasts}
        onClose={notifications.dismissToast}
      />
      <nav className={common.inlineNav}>
        {user?.role !== "Staff" && (
          <Link to="/admin/settings">Cài đặt chung</Link>
        )}
        <Link aria-current="page" to="/admin/membership-tiers">
          Hạng thành viên
        </Link>
      </nav>
      <section className={styles.intro}>
        <span>
          <Award size={29} />
        </span>
        <div>
          <h2>Một chính sách, nhiều giá trị cho độc giả</h2>
          <p>
            Hệ thống tự động nâng hạng theo chi tiêu hợp lệ. Không cần nâng hạng
            thủ công cho từng tài khoản.
          </p>
        </div>
        <ShieldCheck size={28} />
      </section>
      {tiers.error ? (
        <WorkflowError message={tiers.error} retry={tiers.reload} />
      ) : !tiers.data ? (
        <p role="status" className={common.loading}>
          Đang tải cấu hình hạng...
        </p>
      ) : (
        <section className={common.panel}>
          <div className={common.panelHeader}>
            <h2>Tiêu chí & quyền lợi hạng thành viên</h2>
            <span className={common.badge}>
              {tiers.data.length} hạng đang áp dụng
            </span>
          </div>
          <div className={common.tableScroll}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th>Hạng thành viên</th>
                  <th>Chi tiêu tối thiểu</th>
                  <th>Tỷ lệ tích điểm</th>
                  <th>Quyền lợi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tiers.data.map((tier, index) => (
                  <tr key={tier.id}>
                    <td>
                      <strong
                        className={`${styles.tierName} ${styles[`tier${index}`]}`}
                      >
                        <Award size={22} />
                        {tier.tierName}
                      </strong>
                    </td>
                    <td>
                      <strong>{money(tier.minSpending)}</strong>
                    </td>
                    <td>
                      <span className={styles.rate}>{tier.pointRate}%</span>
                    </td>
                    <td className={styles.benefits}>
                      {tier.benefits || "Chưa có mô tả quyền lợi."}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={common.secondary}
                        onClick={() => {
                          setError("");
                          setDraft({
                            ...tier,
                            minSpending: String(tier.minSpending),
                            pointRate: String(tier.pointRate),
                          });
                        }}
                      >
                        <Pencil size={13} />
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className={`${common.panel} ${styles.rules}`}>
        <h2>
          <TrendingUp size={19} />
          Quy tắc hệ thống đang áp dụng
        </h2>
        <div>
          <p>
            <Check size={16} />
            Chỉ tính tiền thực trả từ đơn đã hoàn thành và thanh toán.
          </p>
          <p>
            <Check size={16} />
            Không tính trùng đơn; không tính đơn hủy, thất bại hoặc hoàn trả.
          </p>
          <p>
            <Check size={16} />
            Tự động nâng hạng, lưu lịch sử và gửi thông báo khi đạt mốc.
          </p>
          <p>
            <Check size={16} />
            Không tự hạ hạng hoặc cộng lại điểm của những đơn đã xử lý.
          </p>
        </div>
      </section>
      <div className={common.info}>
        <Info size={21} />
        <p>
          Điểm từ đơn sách giấy được ghi nhận chờ duyệt theo thời hạn đổi trả.
          Thay đổi cấu hình hạng không tự mở điểm chờ và không thay đổi số điểm
          đã ghi nhận.
        </p>
      </div>
      {draft && (
        <WorkflowModal
          title={`Chỉnh sửa hạng ${draft.tierName}`}
          busy={busy}
          onClose={() => setDraft(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className={common.dialogBody}>
              <label className={common.field}>
                Mốc chi tiêu tối thiểu (đ)
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  value={draft.minSpending}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value))
                      setDraft({ ...draft, minSpending: event.target.value });
                  }}
                />
              </label>
              <label className={common.field}>
                Tỷ lệ tích điểm (%)
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="100|[0-9]{1,2}"
                  required
                  value={draft.pointRate}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value))
                      setDraft({ ...draft, pointRate: event.target.value });
                  }}
                />
              </label>
              <label className={common.field}>
                Mô tả quyền lợi
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={draft.benefits ?? ""}
                  onChange={(event) =>
                    setDraft({ ...draft, benefits: event.target.value })
                  }
                />
              </label>
              <p className={common.muted}>
                Cấu hình mới áp dụng cho lần tích điểm tiếp theo, không tính lại
                điểm của đơn đã xử lý.
              </p>
              {error && <WorkflowError message={error} />}
            </div>
            <footer className={common.dialogFooter}>
              <button
                type="button"
                className={common.secondary}
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                Hủy
              </button>
              <button type="submit" className={common.primary} disabled={busy}>
                <Save size={15} />
                {busy ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </footer>
          </form>
        </WorkflowModal>
      )}
    </AdminLayout>
  );
}
