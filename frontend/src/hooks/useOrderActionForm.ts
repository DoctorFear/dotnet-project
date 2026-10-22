import { useState } from 'react';
import { OrderStatus, type Order, type OrderItem, type OrderHistoryReview } from '../types/order';
import { bookIdOf, canCancelOrder, canReturnOrder, canReviewOrder, withinReturnWindow } from '../utils/orderHistory';
import { updateOrderPresentation } from '../services/orderHistoryService';

export type OrderActionMode = 'cancel' | 'return' | 'review';
export const returnReasons = ['Sách bị hư hỏng', 'Giao sai sách', 'Sách thiếu trang hoặc lỗi in', 'Thiếu sản phẩm', 'Lý do khác'];
export const lowRatingReasons = ['Sản phẩm không đúng mô tả', 'Chất lượng sách chưa tốt', 'Đóng gói chưa tốt', 'Giao hàng chưa tốt', 'Lý do khác'];

export const useOrderActionForm = (order: Order, initialItem?: OrderItem) => {
    const [mode, setMode] = useState<OrderActionMode | null>(null);
    const [itemId, setItemId] = useState(initialItem?.id ?? order.orderItems[0]?.id ?? 0);
    const [rating, setRating] = useState(5);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [video, setVideo] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [reading, setReading] = useState(false);
    const item = order.orderItems.find(entry => entry.id === itemId) ?? order.orderItems[0];
    const review = order.reviews?.find(entry => entry.itemId ? entry.itemId === itemId : entry.bookId === bookIdOf(item));
    const fillReview = (selected: OrderItem) => {
        const existing = order.reviews?.find(entry => entry.itemId ? entry.itemId === selected.id : entry.bookId === bookIdOf(selected));
        setRating(existing?.rating ?? 5); setDescription(existing?.content ?? ''); setReason(existing?.reason ?? '');
    };
    const open = (value: OrderActionMode) => {
        setMode(value); setError(''); setReason(''); setDescription(''); setImages([]); setVideo(null);
        const selected = initialItem ?? (value === 'review' ? order.orderItems.find(entry => !order.reviews?.some(existing => existing.itemId ? existing.itemId === entry.id : existing.bookId === bookIdOf(entry))) : order.orderItems[0]);
        if (!selected) { setMode(null); return; }
        setItemId(selected.id);
        if (value === 'review') fillReview(selected);
    };
    const selectItem = (id: number) => { setItemId(id); fillReview(order.orderItems.find(entry => entry.id === id)!); setError(''); };
    const selectFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        const incoming = Array.from(files);
        const imageCount = incoming.filter(file => file.type.startsWith('image/')).length;
        const videoCount = incoming.filter(file => file.type.startsWith('video/')).length;
        if (images.length + imageCount > 6 || (video ? 1 : 0) + videoCount > 1 || incoming.some(file =>
            !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
            setError('Chọn tối đa 6 ảnh JPG/PNG/WebP và 1 video MP4/WebM, mỗi file không quá 10 MB.'); return;
        }
        setReading(true); setError('');
        try {
            const values = await Promise.all(incoming.map(file => new Promise<{ image: boolean; url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ image: file.type.startsWith('image/'), url: String(reader.result) });
                reader.onerror = () => reject(new Error('Không thể đọc file đã chọn.'));
                reader.readAsDataURL(file);
            })));
            setImages(current => [...current, ...values.filter(value => value.image).map(value => value.url)]);
            const selectedVideo = values.find(value => !value.image);
            if (selectedVideo) setVideo(selectedVideo.url);
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đọc file.'); }
        finally { setReading(false); }
    };
    const submit = () => {
        if (reading) return;
        if (mode === 'cancel') {
            if (!canCancelOrder(order)) { setError('Đơn hàng không còn ở trạng thái có thể hủy.'); return; }
            updateOrderPresentation(order, { status: OrderStatus.Failed, failureReason: 'Khách hủy đơn hàng', rewardPoints: 0 });
        } else if (mode === 'return') {
            if (!canReturnOrder(order) || !withinReturnWindow(order)) { setError('Đơn hàng không còn đủ điều kiện hoàn hàng.'); return; }
            if (!returnReasons.includes(reason) || description.trim().length < 10 || images.length === 0 && !video) {
                setError('Vui lòng chọn lý do, mô tả ít nhất 10 ký tự và đính kèm ảnh hoặc video tình trạng sách.'); return;
            }
            updateOrderPresentation(order, { status: OrderStatus.ReturnRequested,
                returnInfo: { reason, description: description.trim(), imageUrls: images, videoUrl: video } });
        } else if (mode === 'review') {
            if (!canReviewOrder(order) || review) return;
            if (!description.trim() || rating <= 2 && !lowRatingReasons.includes(reason)) {
                setError('Vui lòng nhập nhận xét và chọn lý do khi đánh giá 1–2 sao.'); return;
            }
            const next: OrderHistoryReview = { bookId: bookIdOf(item), itemId: item.id, rating, content: description.trim(), reason };
            updateOrderPresentation(order, { reviews: [...(order.reviews ?? []), next], rewardPoints: (order.rewardPoints ?? 0) + 10 });
        }
        setMode(null);
    };
    return { mode, item, itemId, review, rating, reason, description, images, video, error, reading, open,
        close: () => setMode(null), selectItem, setRating, setReason, setDescription, selectFiles,
        removeImage: (index: number) => setImages(current => current.filter((_, position) => position !== index)),
        removeVideo: () => setVideo(null), submit };
};
