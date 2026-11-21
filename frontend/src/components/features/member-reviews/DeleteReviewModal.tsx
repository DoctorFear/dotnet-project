import { useMemberReviews } from '../../../hooks/useMemberReviews';
import { WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';

type Reviews = ReturnType<typeof useMemberReviews>;

export default function DeleteReviewModal({ reviews }: { reviews: Reviews }) {
    if (!reviews.deleting) return null;
    return (
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
                    {reviews.busy ? 'Đang xóa...' : 'Xóa đánh giá'}
                </button>
            </footer>
        </WorkflowModal>
    );
}
