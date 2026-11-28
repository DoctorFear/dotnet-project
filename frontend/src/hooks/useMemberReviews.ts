import { useCallback, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useUser } from '../context/UserContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type { MemberReview, ReviewDraft, ReviewOrder } from '../types/workflow';

export function useMemberReviews(bookId?: number) {
    const { api } = useWorkflow();
    const { updateUser } = useUser();
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState<'pending' | 'reviewed'>('pending');
    const load = useCallback(async () => {
        const [eligible, reviews] = await Promise.all([
            api.reviewOrders(page, 10, bookId),
            api.myReviews(bookId ? 1 : page, 10, bookId),
        ]);
        return { eligible, reviews };
    }, [api, bookId, page]);
    const resource = useWorkflowResource(load);
    const [editor, setEditor] = useState<{ order?: ReviewOrder; review?: MemberReview } | null>(null);
    const [deleting, setDeleting] = useState<MemberReview | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const notifications = useToastNotifications();
    const save = async (draft: ReviewDraft) => {
        if (busy) return false;
        setBusy(true);
        setError('');
        try {
            let successMessage = 'Đã cập nhật đánh giá. Không thưởng thêm điểm.';
            if (editor?.review) {
                await api.updateReview(editor.review.id, draft);
            } else {
                const response = await api.createReview(draft);
                successMessage = response.message;
                const balance = await api.balance();
                updateUser({ fPoints: balance.currentPoints });
            }
            notifications.notify(successMessage);
            setEditor(null);
            resource.reload();
            return true;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể lưu đánh giá.');
            return false;
        } finally {
            setBusy(false);
        }
    };
    const remove = async () => {
        if (!deleting || busy) return;
        setBusy(true);
        setError('');
        try {
            await api.deleteReview(deleting.id);
            setDeleting(null);
            resource.reload();
            notifications.notify('Đã ẩn đánh giá. Giao dịch này không được nhận thưởng đánh giá lần nữa.');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể xóa đánh giá.');
        } finally {
            setBusy(false);
        }
    };
    return {
        resource,
        page,
        setPage,
        tab,
        setTab: (value: 'pending' | 'reviewed') => {
            setTab(value);
            setPage(1);
        },
        editor,
        setEditor,
        deleting,
        setDeleting,
        busy,
        error,
        setError,
        save,
        remove,
        notifications,
        api,
    };
}
