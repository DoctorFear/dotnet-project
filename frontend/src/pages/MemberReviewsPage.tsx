import { useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  Clock3,
  ImagePlus,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemberReviews } from "../hooks/useMemberReviews";
import type { MemberReview, ReviewOrder } from "../types/workflow";
import BookCover from "../components/common/BookCover";
import BookPagination from "../components/common/BookPagination";
import ToastNotification from "../components/common/ToastNotification";
import {
  date,
  EmptyState,
  MemberShell,
  WorkflowError,
  WorkflowModal,
} from "../components/features/workflow/WorkflowShared";
import common from "../components/features/workflow/Workflow.module.css";
import styles from "./MemberReviewsPage.module.css";

const parseImages = (value: string | null): string[] => {
  try {
    const items: unknown = JSON.parse(value || "[]");
    return Array.isArray(items)
      ? items.filter(
          (item): item is string =>
            typeof item === "string" && /^(https?:|blob:)/i.test(item),
        )
      : [];
  } catch {
    return [];
  }
};
const editable = (review: MemberReview) =>
  Date.now() <= new Date(review.createdAt).getTime() + 30 * 86400000;

export default function MemberReviewsPage() {
  const reviews = useMemberReviews();
  const [rating, setRating] = useState(0);
  const [bookId, setBookId] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const data = reviews.resource.data;
  const open = (order?: ReviewOrder, review?: MemberReview) => {
    setBookId(review?.bookId ?? order?.books[0].bookId ?? 0);
    setRating(review?.rating ?? 0);
    setTitle(review?.title ?? "");
    setContent(review?.content ?? "");
    setImages(parseImages(review?.imageUrls ?? null));
    reviews.setError("");
    reviews.setEditor({ order, review });
  };
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (
      images.length + selected.length > 6 ||
      selected.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024 ||
          !file.size,
      )
    ) {
      reviews.setError(
        "Chọn tối đa 6 ảnh JPG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.",
      );
      return;
    }
    setUploading(true);
    reviews.setError("");
    try {
      const results = await Promise.all(
        selected.map((file) => reviews.api.uploadReviewImage(file)),
      );
      const updated = [...images, ...results.map((value) => value.fileUrl)];
      if (JSON.stringify(updated).length > 2000)
        throw new Error(
          "Các liên kết ảnh vượt độ dài cho phép. Vui lòng chọn ít ảnh hơn.",
        );
      setImages(updated);
    } catch (cause) {
      reviews.setError(
        cause instanceof Error ? cause.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setUploading(false);
    }
  };
  return (
    <MemberShell
      title="Đánh giá của tôi"
      subtitle="Chia sẻ trải nghiệm đọc sách và giúp những độc giả khác lựa chọn."
    >
      <ToastNotification
        toasts={reviews.notifications.toasts}
        onClose={reviews.notifications.dismissToast}
      />
      <section className={styles.intro}>
        <span className={styles.introIcon}>
          <MessageSquareText size={28} />
        </span>
        <div>
          <h2>Những đánh giá nhỏ, giá trị thật</h2>
          <p>
            Đánh giá từ giao dịch mua hoặc thuê hợp lệ để nhận F-Point. Mỗi đơn
            hàng hoặc lượt thuê chỉ nhận thưởng đánh giá một lần.
          </p>
        </div>
        <span className={styles.starsArt}>
          <Star size={20} fill="currentColor" />
          <Star size={27} fill="currentColor" />
          <Star size={20} fill="currentColor" />
        </span>
      </section>
      <nav className={styles.tabs} aria-label="Đánh giá cá nhân">
        <button
          type="button"
          aria-pressed={reviews.tab === "pending"}
          onClick={() => reviews.setTab("pending")}
        >
          Chờ đánh giá <span>{data?.eligible.totalCount ?? "—"}</span>
        </button>
        <button
          type="button"
          aria-pressed={reviews.tab === "reviewed"}
          onClick={() => reviews.setTab("reviewed")}
        >
          Đã đánh giá <span>{data?.reviews.totalCount ?? "—"}</span>
        </button>
      </nav>
      {reviews.resource.error ? (
        <WorkflowError
          message={reviews.resource.error}
          retry={reviews.resource.reload}
        />
      ) : reviews.resource.loading ? (
        <p role="status" className={common.loading}>
          Đang tải giao dịch và đánh giá...
        </p>
      ) : (
        <>
          {reviews.tab === "pending" ? (
            data?.eligible.items.length ? (
              <div className={styles.list}>
                {data.eligible.items.map((order) => (
                  <article className={common.panel} key={order.orderId}>
                    <div className={styles.cardHeading}>
                      <strong>
                        <BookOpen size={15} />
                        Đơn ORD-{order.orderId}
                      </strong>
                      <span>Ngày đặt: {date(order.orderDate)}</span>
                    </div>
                    <div className={styles.orderBooks}>
                      {order.books.map((book, index) => (
                        <div
                          className={common.bookRow}
                          key={`${book.bookId}-${index}`}
                        >
                          <BookCover
                            src={book.coverImg ?? undefined}
                            title={book.title}
                            className={common.bookCover}
                          />
                          <div>
                            <h3>{book.title}</h3>
                            <span
                              className={`${common.badge} ${common.badgeGreen}`}
                            >
                              <BadgeCheck size={12} />
                              {book.purchaseType === 1
                                ? "Đã mua sách"
                                : "Đã thuê sách"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <footer className={styles.cardFooter}>
                      <span>
                        {order.books.length > 1
                          ? "Chọn một cuốn sách để đánh giá cho giao dịch này."
                          : "Giao dịch đã đủ điều kiện đánh giá."}
                      </span>
                      <button
                        type="button"
                        className={common.primary}
                        onClick={() => open(order)}
                      >
                        <Star size={15} />
                        Viết đánh giá
                        <ChevronRight size={14} />
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Bạn đã xem hết các giao dịch cần đánh giá"
                detail="Đơn sách giấy cần hoàn thành và thanh toán; lượt thuê cần thanh toán và kích hoạt quyền đọc."
              />
            )
          ) : data?.reviews.items.length ? (
            <div className={styles.list}>
              {data.reviews.items.map((review) => (
                <article
                  key={review.id}
                  className={`${common.panel} ${styles.reviewCard}`}
                >
                  <div className={styles.reviewHeading}>
                    <div>
                      <h2>{review.bookTitle}</h2>
                      <span className={common.muted}>
                        {review.orderId ? `Đơn ORD-${review.orderId} · ` : ""}
                        {date(review.createdAt)}
                      </span>
                    </div>
                    <span className={`${common.badge} ${common.badgeGreen}`}>
                      <BadgeCheck size={12} />
                      {review.verificationLabel || "Giao dịch đã xác thực"}
                    </span>
                  </div>
                  <div
                    className={styles.rating}
                    aria-label={`${review.rating} trên 5 sao`}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={16}
                        fill={value <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  {review.title && <h3>{review.title}</h3>}
                  <p className={styles.reviewContent}>{review.content}</p>
                  {parseImages(review.imageUrls).length > 0 && (
                    <div className={styles.images}>
                      {parseImages(review.imageUrls).map((url) => (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          key={url}
                        >
                          <img src={url} alt="Ảnh thực tế trong đánh giá" />
                        </a>
                      ))}
                    </div>
                  )}
                  <footer className={styles.reviewFooter}>
                    <span>
                      <Clock3 size={12} />
                      {editable(review)
                        ? "Được chỉnh sửa trong 30 ngày kể từ khi gửi"
                        : "Đã hết thời hạn chỉnh sửa"}
                    </span>
                    <div>
                      {editable(review) && (
                        <button
                          type="button"
                          onClick={() => open(undefined, review)}
                        >
                          <Pencil size={13} />
                          Chỉnh sửa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          reviews.setError("");
                          reviews.setDeleting(review);
                        }}
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Bạn chưa có đánh giá nào"
              detail="Chọn tab Chờ đánh giá để chia sẻ cảm nhận về sách."
            />
          )}
          {data && (
            <BookPagination
              page={reviews.page}
              pageSize={10}
              pageSizes={[10]}
              totalCount={
                reviews.tab === "pending"
                  ? data.eligible.totalCount
                  : data.reviews.totalCount
              }
              onPageChange={reviews.setPage}
              onPageSizeChange={() => {}}
              itemLabel={reviews.tab === "pending" ? "giao dịch" : "đánh giá"}
            />
          )}
        </>
      )}
      <div className={styles.note}>
        <ShieldCheck size={16} />
        <p>
          Chỉ đánh giá từ giao dịch của chính bạn. Sửa đánh giá không nhận thêm
          điểm; xóa rồi gửi lại cũng không được thưởng lần nữa.
        </p>
      </div>
      {reviews.editor && (
        <WorkflowModal
          title={
            reviews.editor.review ? "Chỉnh sửa đánh giá" : "Đánh giá cuốn sách"
          }
          busy={reviews.busy || uploading}
          onClose={() => reviews.setEditor(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void reviews.save({
                orderId:
                  reviews.editor?.order?.orderId ??
                  reviews.editor?.review?.orderId ??
                  undefined,
                bookId,
                rating,
                title: title.trim(),
                content: content.trim(),
                imageUrls: JSON.stringify(images),
              });
            }}
          >
            <div className={common.dialogBody}>
              {reviews.editor.order && reviews.editor.order.books.length > 1 ? (
                <label className={common.field}>
                  Chọn sách trong đơn
                  <select
                    value={bookId}
                    onChange={(event) => setBookId(Number(event.target.value))}
                  >
                    {reviews.editor.order.books.map((book, index) => (
                      <option
                        value={book.bookId}
                        key={`${book.bookId}-${index}`}
                      >
                        {book.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className={styles.editBook}>
                  <BookOpen size={20} />
                  {reviews.editor.review?.bookTitle ??
                    reviews.editor.order?.books[0].title}
                </p>
              )}
              <div className={styles.ratingPicker}>
                <p>Bạn cảm nhận thế nào về cuốn sách?</p>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-label={`Đánh giá ${value} sao`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                    >
                      <Star
                        size={32}
                        fill={value <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <small>
                  {
                    [
                      "Chọn số sao để đánh giá",
                      "Rất không hài lòng",
                      "Chưa hài lòng",
                      "Bình thường",
                      "Hài lòng",
                      "Rất hài lòng",
                    ][rating]
                  }
                </small>
              </div>
              <label className={common.field}>
                Tiêu đề (không bắt buộc)
                <input
                  maxLength={200}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Một câu ngắn về trải nghiệm của bạn"
                />
              </label>
              <label className={common.field}>
                Nhận xét của bạn
                <textarea
                  required
                  rows={4}
                  maxLength={4000}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Chia sẻ về nội dung, chất lượng sách và trải nghiệm đọc..."
                />
                <small>{content.length}/4.000 ký tự</small>
              </label>
              <div className={styles.upload}>
                <label>
                  <ImagePlus size={19} />
                  {uploading ? "Đang tải ảnh..." : "Thêm ảnh thực tế"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploading || reviews.busy || images.length >= 6}
                    onChange={(event) => {
                      void upload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                <small>JPG, PNG, WebP · Tối đa 6 ảnh, 5 MB/ảnh</small>
              </div>
              {images.length > 0 && (
                <div className={styles.images}>
                  {images.map((url, index) => (
                    <div key={`${url}-${index}`}>
                      <img src={url} alt={`Ảnh đánh giá ${index + 1}`} />
                      <button
                        type="button"
                        disabled={uploading || reviews.busy}
                        aria-label={`Bỏ ảnh ${index + 1}`}
                        onClick={() =>
                          setImages(images.filter((_, i) => i !== index))
                        }
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {reviews.error && <WorkflowError message={reviews.error} />}
            </div>
            <footer className={common.dialogFooter}>
              <button
                type="button"
                className={common.secondary}
                disabled={reviews.busy || uploading}
                onClick={() => reviews.setEditor(null)}
              >
                Để sau
              </button>
              <button
                type="submit"
                className={common.primary}
                disabled={
                  !rating || !content.trim() || reviews.busy || uploading
                }
              >
                {reviews.busy
                  ? "Đang gửi..."
                  : reviews.editor.review
                    ? "Lưu thay đổi"
                    : "Gửi đánh giá"}
              </button>
            </footer>
          </form>
        </WorkflowModal>
      )}
      {reviews.deleting && (
        <WorkflowModal
          title="Xóa đánh giá này?"
          busy={reviews.busy}
          onClose={() => reviews.setDeleting(null)}
        >
          <div className={common.dialogBody}>
            <p className={common.muted}>
              Đánh giá sẽ được ẩn khỏi trang sách. Bạn không thể tạo lại đánh
              giá cho giao dịch này để nhận thêm điểm.
            </p>
            {reviews.error && <WorkflowError message={reviews.error} />}
          </div>
          <footer className={common.dialogFooter}>
            <button
              type="button"
              className={common.secondary}
              onClick={() => reviews.setDeleting(null)}
              disabled={reviews.busy}
            >
              Giữ đánh giá
            </button>
            <button
              type="button"
              className={common.danger}
              disabled={reviews.busy}
              onClick={() => void reviews.remove()}
            >
              {reviews.busy ? "Đang xóa..." : "Xóa đánh giá"}
            </button>
          </footer>
        </WorkflowModal>
      )}
    </MemberShell>
  );
}
