import { useState } from 'react';
import { type Order, type OrderItem } from '../types/order';
import { bookIdOf, canCancelOrder, canReturnOrder, canReviewOrder, withinReturnWindow } from '../utils/orderHistory';
import { notifyOrderHistoryChanged } from '../services/orderHistoryService';
import { cancelOrder } from '../services/orderService';
import { submitRefundRequest } from '../services/refundService';
import type { RefundRequest } from '../types/refund';
import { useWorkflow } from '../context/WorkflowContext';
import { useUser } from '../context/UserContext';

export type OrderActionMode = 'cancel' | 'return' | 'review';
export const returnReasons = ['Sách bị hư hỏng', 'Giao sai sách', 'Sách thiếu trang hoặc lỗi in', 'Thiếu sản phẩm', 'Lý do khác'];
export const lowRatingReasons = ['Sản phẩm không đúng mô tả', 'Chất lượng sách chưa tốt', 'Đóng gói chưa tốt', 'Giao hàng chưa tốt', 'Lý do khác'];

export const useOrderActionForm = (order: Order, initialItem?: OrderItem) => {
    const { api } = useWorkflow();
    const { updateUser } = useUser();
    const [mode, setMode] = useState<OrderActionMode | null>(null);
    const [itemId, setItemId] = useState(initialItem?.id ?? order.orderItems[0]?.id ?? 0);
    const [rating, setRating] = useState(0);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [shippingMethod, setShippingMethod] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [images, setImages] = useState<{ url: string; file: File }[]>([]);
    const [video, setVideo] = useState<{ url: string; file: File } | null>(null);
    const [error, setError] = useState('');
    const [reading, setReading] = useState(false);
    const item = order.orderItems.find(entry => entry.id === itemId) ?? order.orderItems[0];
    const review = order.reviews?.find(entry => entry.itemId ? entry.itemId === itemId : entry.bookId === bookIdOf(item));
    const fillReview = (selected: OrderItem) => {
        const existing = order.reviews?.find(entry => entry.itemId ? entry.itemId === selected.id : entry.bookId === bookIdOf(selected));
        setRating(existing?.rating ?? 0); setDescription(existing?.content ?? ''); setReason(existing?.reason ?? '');
    };
    const open = (value: OrderActionMode) => {
        setMode(value); setError(''); setReason(''); setDescription(''); setImages([]); setVideo(null); setShippingMethod(''); setBankAccount('');
        const selected = initialItem ?? (value === 'review' ? order.orderItems.find(entry => !order.reviews?.some(existing => existing.itemId ? existing.itemId === entry.id : existing.bookId === bookIdOf(entry))) : order.orderItems[0]);
        if (!selected) { setMode(null); return; }
        setItemId(selected.id);
        if (value === 'review') fillReview(selected);
    };
    const selectItem = (id: number) => { setItemId(id); fillReview(order.orderItems.find(entry => entry.id === id)!); setError(''); };
    const selectFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        const incoming = Array.from(files);
        const reviewUpload = mode === 'review';
        const imageCount = incoming.filter(file => file.type.startsWith('image/')).length;
        const videoCount = incoming.filter(file => file.type.startsWith('video/')).length;
        const allowedTypes = reviewUpload
            ? ['image/jpeg', 'image/png', 'image/webp']
            : ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
        const maxBytes = (reviewUpload ? 5 : 10) * 1024 * 1024;
        if (images.length + imageCount > 6 || reviewUpload && videoCount > 0
            || !reviewUpload && (video ? 1 : 0) + videoCount > 1
            || incoming.some(file => !allowedTypes.includes(file.type) || file.size === 0 || file.size > maxBytes)) {
            setError(reviewUpload
                ? 'Chọn tối đa 6 ảnh JPG/PNG/WebP, mỗi ảnh không quá 5 MB.'
                : 'Chọn tối đa 6 ảnh JPG/PNG/WebP và 1 video MP4/WebM, mỗi file không quá 10 MB.');
            return;
        }
        setReading(true); setError('');
        try {
            const values = await Promise.all(incoming.map(file => new Promise<{ image: boolean; url: string; file: File }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ image: file.type.startsWith('image/'), url: String(reader.result), file });
                reader.onerror = () => reject(new Error('Không thể đọc file đã chọn.'));
                reader.readAsDataURL(file);
            })));
            setImages(current => [...current, ...values.filter(value => value.image).map(v => ({ url: v.url, file: v.file }))]);
            const selectedVideo = values.find(value => !value.image);
            if (selectedVideo) setVideo({ url: selectedVideo.url, file: selectedVideo.file });
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đọc file.'); }
        finally { setReading(false); }
    };
    const submit = async () => {
        if (reading) return;
        if (mode === 'cancel') {
            if (!canCancelOrder(order)) { setError('Đơn hàng không còn ở trạng thái có thể hủy.'); return; }
            setReading(true); setError('');
            try {
                await cancelOrder(order.id);
                const balance = await api.balance().catch(() => null);
                if (balance) updateUser({ fPoints: balance.currentPoints });
                notifyOrderHistoryChanged();
                setMode(null);
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Không thể hủy đơn hàng.');
            } finally { setReading(false); }
            return;
        }
        if (mode === 'return') {
            if (!canReturnOrder(order) || !withinReturnWindow(order)) { setError('Đơn hàng không còn đủ điều kiện hoàn hàng.'); return; }
            if (!returnReasons.includes(reason) || description.trim().length < 10 || images.length === 0 && !video) {
                setError('Vui lòng chọn lý do, mô tả ít nhất 10 ký tự và đính kèm ảnh hoặc video tình trạng sách.'); return;
            }
            if (!shippingMethod.trim() || !bankAccount.trim()) {
                setError('Vui lòng nhập phương thức gửi hàng và tài khoản nhận tiền.'); return;
            }
            setReading(true); setError('');
            try {
                const refundRequest: RefundRequest = {
                    orderId: order.id,
                    reason,
                    description: description.trim(),
                    shippingMethod: shippingMethod.trim(),
                    bankAccount: bankAccount.trim(),
                    images: images.map(img => img.file),
                    video: video?.file ?? null,
                };
                await submitRefundRequest(refundRequest);
                notifyOrderHistoryChanged();
                setMode(null);
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Lỗi khi gửi yêu cầu hoàn tiền.');
            } finally { setReading(false); }
            return;
        }
        if (mode === 'review') {
            if (!canReviewOrder(order) || review || !item) return;
            if (rating < 1 || rating > 5) {
                setError('Vui lòng chọn số sao từ 1 đến 5.'); return;
            }
            if (description.trim().length < 10) {
                setError('Nhận xét phải có ít nhất 10 ký tự.'); return;
            }
            if (rating <= 2 && !lowRatingReasons.includes(reason)) {
                setError('Vui lòng chọn lý do khi đánh giá 1–2 sao.'); return;
            }
            setReading(true); setError('');
            try {
                const uploaded = await Promise.all(images.map(image => api.uploadReviewImage(image.file)));
                await api.createReview({
                    orderId: order.id,
                    bookId: bookIdOf(item),
                    rating,
                    content: description.trim(),
                    imageUrls: JSON.stringify(uploaded.map(value => value.fileUrl)),
                });
                const balance = await api.balance().catch(() => null);
                if (balance) updateUser({ fPoints: balance.currentPoints });
                notifyOrderHistoryChanged();
                setMode(null);
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Không thể gửi đánh giá.');
            } finally { setReading(false); }
        }
    };
    return { mode, item, itemId, review, rating, reason, description, images, video, error, reading, open, shippingMethod, bankAccount,
        close: () => setMode(null), selectItem, setRating, setReason, setDescription, selectFiles, setShippingMethod, setBankAccount,
        removeImage: (index: number) => setImages(current => current.filter((_, position) => position !== index)),
        removeVideo: () => setVideo(null), submit };
};
