import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  Gift,
  Info,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLoyalty } from "../hooks/useLoyalty";
import { useWorkflow } from "../context/WorkflowContext";
import BookPagination from "../components/common/BookPagination";
import ToastNotification from "../components/common/ToastNotification";
import {
  date,
  dateTime,
  EmptyState,
  MemberShell,
  money,
  number,
  WorkflowError,
  WorkflowModal,
} from "../components/features/workflow/WorkflowShared";
import common from "../components/features/workflow/Workflow.module.css";
import styles from "./LoyaltyPage.module.css";

export default function LoyaltyPage({
  membership = false,
}: {
  membership?: boolean;
}) {
  const loyalty = useLoyalty();
  const { preview } = useWorkflow();
  const [amount, setAmount] = useState("200000");
  const [points, setPoints] = useState("0");
  const [accepted, setAccepted] = useState(false);
  const data = loyalty.resource.data;
  const balance = data?.balance;
  const tiers = data?.tiers ?? [];
  const currentIndex = tiers.findIndex(
    (tier) => tier.tierName === balance?.tierName,
  );
  const current = tiers[currentIndex] ?? tiers[0];
  const next = tiers[currentIndex + 1];
  const progress = !next
    ? 100
    : Math.max(
        0,
        Math.min(
          100,
          (((balance?.totalSpent ?? 0) - (current?.minSpending ?? 0)) /
            Math.max(1, next.minSpending - (current?.minSpending ?? 0))) *
            100,
        ),
      );
  const maxPreview = Math.min(
    balance?.currentPoints ?? 0,
    1000,
    Math.floor(Number(amount) / 200),
  );
  const path = (tab: string) =>
    preview
      ? `/preview/huy/${tab}`
      : tab === "membership"
        ? "/membership"
        : "/f-point";
  return (
    <MemberShell
      title={membership ? "Hạng thành viên" : "Ví F-Point của tôi"}
      subtitle={
        membership
          ? "Theo dõi hành trình tích lũy và những quyền lợi dành riêng cho bạn."
          : "Tích lũy từ mỗi trang sách. Dùng điểm cho những lần mua tiếp theo."
      }
    >
      <ToastNotification
        toasts={loyalty.notifications.toasts}
        onClose={loyalty.notifications.dismissToast}
      />
      {loyalty.resource.error ? (
        <WorkflowError
          message={loyalty.resource.error}
          retry={loyalty.resource.reload}
        />
      ) : !data || !balance ? (
        <p role="status" className={common.loading}>
          Đang tải ví điểm và hạng thành viên...
        </p>
      ) : (
        <>
          <div className={styles.heroGrid}>
            <section className={styles.wallet}>
              <div className={styles.walletTop}>
                <span>
                  <Wallet size={17} /> VÍ F-POINT
                </span>
                <span>
                  ancient<span>BOOK</span>
                </span>
              </div>
              <p>Điểm khả dụng</p>
              <strong className={styles.balance}>
                {number(balance.currentPoints)}
                <span>F-Point</span>
              </strong>
              <p className={styles.value}>
                Tương đương {money(balance.currentPoints * 100)} giảm giá
              </p>
              <div className={styles.walletBottom}>
                <span>
                  <Clock3 size={15} /> Điểm chờ duyệt
                </span>
                <strong>
                  {number(balance.pendingPoints)} <small>điểm</small>
                </strong>
              </div>
              <Coins className={styles.watermark} size={135} />
            </section>
            <section className={styles.tierSummary}>
              <span className={common.eyebrow}>HẠNG THÀNH VIÊN HIỆN TẠI</span>
              <div className={styles.tierIdentity}>
                <span className={styles.medal}>
                  <Award size={31} />
                </span>
                <div>
                  <h2>Hạng {balance.tierName}</h2>
                  <p>Tích {balance.pointRate}% F-Point mỗi đơn hợp lệ</p>
                </div>
              </div>
              <Link to={path(membership ? "points" : "membership")}>
                {membership ? "Xem ví F-Point" : "Khám phá quyền lợi"}
                <ChevronRight size={14} />
              </Link>
              <span className={styles.tierFoot}>
                <ShieldCheck size={12} /> Hạng được hệ thống tự động cập nhật
              </span>
            </section>
          </div>
          <section className={`${common.panel} ${styles.progressPanel}`}>
            <div className={common.actionRow}>
              <div>
                <span className={common.eyebrow}>HÀNH TRÌNH THĂNG HẠNG</span>
                <h3>
                  {next ? (
                    <>
                      Tiến gần hơn đến hạng <span>{next.tierName}</span>
                    </>
                  ) : (
                    "Bạn đang ở hạng thành viên cao nhất"
                  )}
                </h3>
              </div>
              <TrendingUp size={24} />
            </div>
            <div className={styles.progressLabels}>
              <span>
                Chi tiêu hợp lệ: <strong>{money(balance.totalSpent)}</strong>
              </span>
              {next && (
                <span>
                  Mốc {next.tierName}: {money(next.minSpending)}
                </span>
              )}
            </div>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="Tiến trình thăng hạng"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {next ? (
                <>
                  Còn{" "}
                  <strong>
                    {money(Math.max(0, next.minSpending - balance.totalSpent))}
                  </strong>{" "}
                  để đạt hạng {next.tierName} và tích {next.pointRate}% điểm cho
                  những đơn tiếp theo.
                </>
              ) : (
                "Cảm ơn bạn đã đồng hành cùng ancientBOOK."
              )}
            </p>
          </section>
          <nav className={styles.tabs} aria-label="Ví và quyền lợi thành viên">
            <Link
              to={path("points")}
              aria-current={!membership ? "page" : undefined}
            >
              <Wallet size={15} />
              Điểm & giao dịch
            </Link>
            <Link
              to={path("membership")}
              aria-current={membership ? "page" : undefined}
            >
              <Award size={16} />
              Các hạng thành viên
            </Link>
          </nav>
          {membership ? (
            <>
              <div className={styles.tierCards}>
                {tiers.map((tier, index) => (
                  <article
                    key={tier.id}
                    className={`${styles.tierCard} ${styles[`tier${index}`]}`}
                  >
                    <div className={styles.tierCardTop}>
                      <Award size={35} />
                      <span>
                        {tier.tierName === balance.tierName
                          ? "Hạng hiện tại"
                          : index > currentIndex
                            ? "Hạng tiếp theo"
                            : "Đã đạt"}
                      </span>
                    </div>
                    <h2>{tier.tierName}</h2>
                    <p>Chi tiêu từ {money(tier.minSpending)}</p>
                    <strong>
                      {tier.pointRate}%<small>tích điểm F-Point</small>
                    </strong>
                    <ul>
                      <li>
                        <Check size={13} />1 điểm tương đương 100 đ
                      </li>
                      <li>
                        <Check size={13} />
                        {tier.benefits ||
                          "Tích điểm khi hoàn thành giao dịch hợp lệ."}
                      </li>
                      <li>
                        <Check size={13} />
                        {index === currentIndex
                          ? "Đang áp dụng cho tài khoản của bạn"
                          : "Tự động áp dụng khi đủ điều kiện"}
                      </li>
                    </ul>
                  </article>
                ))}
              </div>
              <div className={common.info}>
                <Info size={22} />
                <p>
                  Hệ thống chỉ tính tiền thực trả của đơn hoàn thành và đã thanh
                  toán, không tính trùng hoặc tính đơn đang hoàn trả. Không tự
                  hạ hạng; tỷ lệ mới áp dụng cho các đơn tiếp theo.
                </p>
              </div>
            </>
          ) : (
            <>
              <section className={`${common.panel} ${styles.history}`}>
                <div className={common.panelHeader}>
                  <h2>Lịch sử giao dịch điểm</h2>
                  <span className={common.muted}>
                    {data.history.totalCount} giao dịch
                  </span>
                </div>
                {data.history.items.length === 0 ? (
                  <EmptyState
                    title="Chưa có giao dịch điểm"
                    detail="Điểm từ đơn hàng và đánh giá hợp lệ sẽ xuất hiện tại đây."
                  />
                ) : (
                  <div className={common.tableScroll}>
                    <table className={common.table}>
                      <thead>
                        <tr>
                          <th>Giao dịch</th>
                          <th>Điểm</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.history.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className={styles.transaction}>
                                <span
                                  className={`${styles.transactionIcon} ${item.pointUsed > 0 ? styles.debitIcon : ""}`}
                                >
                                  {item.status === "Pending" ? (
                                    <Clock3 size={17} />
                                  ) : item.pointUsed > 0 ? (
                                    <ArrowUpRight size={17} />
                                  ) : (
                                    <ArrowDownLeft size={17} />
                                  )}
                                </span>
                                <div>
                                  <strong>
                                    {item.description ||
                                      (item.pointUsed > 0
                                        ? "Sử dụng F-Point"
                                        : "Tích lũy F-Point")}
                                  </strong>
                                  <small>{dateTime(item.createdAt)}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong
                                className={
                                  item.status === "Cancelled"
                                    ? styles.cancelled
                                    : item.pointUsed > 0
                                      ? styles.debit
                                      : styles.credit
                                }
                              >
                                {item.pointUsed <= 0 ? "+" : "−"}
                                {number(Math.abs(item.pointUsed))}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`${common.badge} ${item.status === "Pending" ? common.badgeGold : item.status === "Cancelled" ? common.badgeGray : common.badgeGreen}`}
                              >
                                {item.status === "Pending"
                                  ? "Chờ duyệt"
                                  : item.status === "Cancelled"
                                    ? "Đã hủy"
                                    : item.pointUsed > 0
                                      ? "Đã sử dụng"
                                      : "Đã vào ví"}
                              </span>
                              {item.status === "Pending" &&
                                item.availableAt && (
                                  <small>
                                    Dự kiến: {date(item.availableAt)}
                                  </small>
                                )}
                            </td>
                            <td>
                              {item.status === "Pending" && item.orderId && (
                                <button
                                  type="button"
                                  className={styles.receiptButton}
                                  disabled={loyalty.busy}
                                  onClick={() => {
                                    setAccepted(false);
                                    void loyalty.openReceipt(item.orderId!);
                                  }}
                                >
                                  Xác nhận nhận hàng
                                  <ChevronRight size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <BookPagination
                  page={loyalty.page}
                  pageSize={10}
                  totalCount={data.history.totalCount}
                  pageSizes={[10]}
                  onPageChange={loyalty.setPage}
                  onPageSizeChange={() => {}}
                  itemLabel="giao dịch"
                />
              </section>
              <div className={styles.bottomGrid}>
                <section className={common.panel}>
                  <div className={common.panelHeader}>
                    <h2>
                      <Coins size={17} />
                      Xem trước mức giảm
                    </h2>
                  </div>
                  <form
                    className={common.panelBody}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void loyalty.preview(Number(points), Number(amount));
                    }}
                  >
                    <div className={common.twoColumns}>
                      <label className={common.field}>
                        Tiền sách (đ)
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]+"
                          value={amount}
                          onChange={(event) => {
                            if (!/^\d*$/.test(event.target.value)) return;
                            setAmount(event.target.value);
                            loyalty.setPreviewResult(null);
                          }}
                          required
                        />
                      </label>
                      <label className={common.field}>
                        Số F-Point muốn dùng
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]+"
                          value={points}
                          onChange={(event) => {
                            if (!/^\d*$/.test(event.target.value)) return;
                            setPoints(event.target.value);
                            loyalty.setPreviewResult(null);
                          }}
                          required
                        />
                      </label>
                    </div>
                    <p className={styles.limit}>
                      Tối đa theo số dư và tiền sách: {number(maxPreview)} điểm.
                      Hạn mức cấu hình được kiểm tra khi xem trước.
                    </p>
                    <button
                      type="submit"
                      className={common.primary}
                      disabled={loyalty.busy}
                    >
                      Tính mức giảm <ArrowRight size={15} />
                    </button>
                    {loyalty.previewResult && (
                      <div className={styles.previewResult}>
                        <span>
                          Giảm {money(loyalty.previewResult.discountAmount)}
                        </span>
                        <strong>
                          Còn {money(loyalty.previewResult.finalAmount)}
                        </strong>
                        <small>
                          Chưa trừ điểm. Điểm chỉ bị trừ khi đặt hàng thành
                          công.
                        </small>
                      </div>
                    )}
                  </form>
                </section>
                <section className={`${common.panel} ${styles.rules}`}>
                  <h2>Dùng điểm như thế nào?</h2>
                  <p>
                    <Coins size={17} />
                    <span>
                      <strong>1 F-Point = 100 đ</strong>Chỉ dùng điểm khả dụng
                      để giảm tiền sách.
                    </span>
                  </p>
                  <p>
                    <LockKeyhole size={17} />
                    <span>
                      <strong>Điểm chờ chưa thể sử dụng</strong>Mở điểm khi đủ
                      điều kiện nhận hàng hoặc hết hạn đổi trả.
                    </span>
                  </p>
                  <p>
                    <Gift size={17} />
                    <span>
                      <strong>Tối đa 1.000 điểm mỗi đơn</strong>Không vượt 50%
                      tiền sách và hạn mức cấu hình. Không giảm phí vận chuyển.
                    </span>
                  </p>
                </section>
              </div>
            </>
          )}
          {loyalty.error && !loyalty.receipt && (
            <WorkflowError message={loyalty.error} />
          )}
          <p className={styles.finalNote}>
            <BookOpen size={14} /> Đơn hàng hoàn tất, niềm vui đọc sách tiếp
            nối.
          </p>
        </>
      )}
      {loyalty.receipt && (
        <WorkflowModal
          title="Xác nhận đã nhận hàng"
          busy={loyalty.busy}
          onClose={() => loyalty.setReceipt(null)}
        >
          <div className={common.dialogBody}>
            <div className={common.info}>
              <CheckCircle2 size={25} />
              <div>
                <strong>Đơn ORD-{loyalty.receipt.orderId}</strong>
                <p>
                  {number(loyalty.receipt.pendingPoints)} F-Point sẽ chuyển
                  thành khả dụng khi bạn xác nhận.
                </p>
              </div>
            </div>
            {loyalty.error && <WorkflowError message={loyalty.error} />}
            <p className={common.muted}>
              Chỉ xác nhận sau khi bạn đã nhận đủ sách và kiểm tra tình trạng
              hàng.
            </p>
            <label className={common.checkbox}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              Tôi đã nhận hàng và đồng ý kết thúc quyền đổi trả/hoàn tiền của
              đơn này theo quy định.
            </label>
            {!loyalty.receipt.canConfirmReceipt && (
              <WorkflowError message="Đơn không còn đủ điều kiện xác nhận nhận hàng. Vui lòng tải lại dữ liệu." />
            )}
          </div>
          <footer className={common.dialogFooter}>
            <button
              type="button"
              className={common.secondary}
              disabled={loyalty.busy}
              onClick={() => loyalty.setReceipt(null)}
            >
              Để sau
            </button>
            <button
              type="button"
              className={common.primary}
              disabled={
                !accepted || !loyalty.receipt.canConfirmReceipt || loyalty.busy
              }
              onClick={() => void loyalty.confirm()}
            >
              {loyalty.busy ? "Đang xác nhận..." : "Xác nhận nhận hàng"}
            </button>
          </footer>
        </WorkflowModal>
      )}
    </MemberShell>
  );
}
