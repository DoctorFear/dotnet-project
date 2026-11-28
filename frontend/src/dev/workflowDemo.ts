import type { WorkflowApi } from '../services/workflowService';
import type {
    DeliveryDetail,
    MemberReview,
    MembershipTier,
    PackingDetail,
    PackingOrder,
    PointBalance,
    PointTransaction,
    ReviewOrder,
} from '../types/workflow';

const now = () => new Date().toISOString();
const dated = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const page = <T>(items: T[], pageNumber: number, pageSize: number) => ({
    items: structuredClone(items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)),
    totalCount: items.length,
    pageNumber,
    pageSize,
});
const wait = async <T>(value: T) => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return structuredClone(value);
};

export function createWorkflowDemo(): WorkflowApi {
    const deliveries: DeliveryDetail[] = [
        {
            orderId: 1052,
            orderCode: 'ORD-1052',
            customerName: 'Nguyễn Thảo Nguyên',
            receiverPhone: '0901234567',
            shippingAddress: '128 Nguyễn Thị Minh Khai, Phường Bến Thành, TP. Hồ Chí Minh',
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Express',
            deliveryNote: 'Vui lòng gọi trước 10 phút; giao tại sảnh.',
            waybillCode: 'AB-20261128-00001001',
            finalAmount: 248000,
            codAmount: 248000,
            isPaid: false,
            status: 'Prepared',
            deliveryType: 'Outbound',
            orderDate: now(),
            note: null,
            startedAt: null,
            isReadOnly: false,
            completedAt: null,
            failureReason: null,
            failureNote: null,
            items: [{ bookId: 2, bookTitle: 'Lược sử vạn vật', quantity: 1, unitPrice: 248000 }],
        },
        {
            orderId: 1051,
            orderCode: 'ORD-1051',
            customerName: 'Trần Minh Anh',
            receiverPhone: '0912345678',
            shippingAddress: '45 Võ Thị Sáu, Phường Tân Định, TP. Hồ Chí Minh',
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            deliveryNote: null,
            waybillCode: 'AB-20261128-00001002',
            finalAmount: 320000,
            codAmount: 0,
            isPaid: true,
            status: 'Shipping',
            deliveryType: 'Outbound',
            orderDate: dated(-1),
            note: null,
            startedAt: null,
            isReadOnly: false,
            completedAt: null,
            failureReason: null,
            failureNote: null,
            items: [{ bookId: 3, bookTitle: 'Đại Việt sử ký toàn thư', quantity: 2, unitPrice: 160000 }],
        },
        {
            orderId: 1050,
            orderCode: 'ORD-1050',
            customerName: 'Phạm Đức Huy',
            receiverPhone: '0987654321',
            shippingAddress: '12 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh',
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            deliveryNote: null,
            waybillCode: 'AB-20261128-00001003',
            finalAmount: 153000,
            codAmount: 153000,
            isPaid: false,
            status: 'Shipping',
            deliveryType: 'Outbound',
            orderDate: dated(-1),
            note: null,
            startedAt: null,
            isReadOnly: false,
            completedAt: null,
            failureReason: null,
            failureNote: null,
            items: [{ bookId: 4, bookTitle: 'Nhà giả kim', quantity: 1, unitPrice: 153000 }],
        },
        {
            orderId: 1048,
            orderCode: 'ORD-1048',
            customerName: 'Lê Hoài Nam',
            receiverPhone: '0933333333',
            shippingAddress: '76 Trần Hưng Đạo, Phường Cầu Ông Lãnh, TP. Hồ Chí Minh',
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            deliveryNote: null,
            waybillCode: 'AB-20261128-00001004',
            finalAmount: 120000,
            codAmount: 0,
            isPaid: true,
            status: 'Completed',
            deliveryType: 'Outbound',
            orderDate: dated(-2),
            note: null,
            startedAt: null,
            isReadOnly: true,
            completedAt: dated(-1),
            failureReason: null,
            failureNote: null,
            items: [{ bookId: 5, bookTitle: 'Dế mèn phiêu lưu ký', quantity: 1, unitPrice: 120000 }],
        },
        {
            orderId: 1043,
            orderCode: 'ORD-1043',
            customerName: 'Võ Quỳnh Như',
            receiverPhone: '0944444444',
            shippingAddress: '81 Điện Biên Phủ, Phường Gia Định, TP. Hồ Chí Minh',
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            deliveryNote: null,
            waybillCode: 'AB-20261128-00001005',
            finalAmount: 185000,
            codAmount: 185000,
            isPaid: false,
            status: 'Failed',
            deliveryType: 'Outbound',
            orderDate: dated(-3),
            note: null,
            startedAt: null,
            isReadOnly: true,
            completedAt: dated(-2),
            failureReason: 'Không liên hệ được khách hàng',
            failureNote: 'Đã gọi 3 lần, khách không nghe máy.',
            items: [{ bookId: 6, bookTitle: 'Sapiens — Lược sử loài người', quantity: 1, unitPrice: 185000 }],
        },
    ];
    const reasons = [
        { id: 1, reasonText: 'Không liên hệ được khách hàng' },
        { id: 2, reasonText: 'Khách từ chối nhận hàng' },
        { id: 3, reasonText: 'Địa chỉ giao hàng không chính xác' },
        { id: 4, reasonText: 'Kiện hàng bị hư hỏng' },
    ];
    const packing: PackingOrder[] = [
        {
            orderId: 2052,
            customerName: 'Nguyễn Thảo Nguyên',
            orderDate: now(),
            totalItems: 2,
            finalAmount: 368000,
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            status: 2,
            packingIssue: null,
        },
        {
            orderId: 2051,
            customerName: 'Trần Minh Anh',
            orderDate: now(),
            totalItems: 1,
            finalAmount: 185000,
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            status: 2,
            packingIssue: null,
        },
        {
            orderId: 2049,
            customerName: 'Phạm Đức Huy',
            orderDate: dated(-1),
            totalItems: 3,
            finalAmount: 459000,
            shippingCarrier: 'AncientBook Delivery',
            deliveryPriority: 'Standard',
            status: 2,
            packingIssue: 'Một cuốn sách bị móp góc, cần thay trước khi đóng gói.',
        },
    ];
    const details: Record<number, PackingDetail> = Object.fromEntries(
        packing.map((item) => [
            item.orderId,
            {
                orderId: item.orderId,
                customerName: item.customerName,
                receiverPhone: '0901234567',
                shippingAddress: '128 Nguyễn Thị Minh Khai, Phường Bến Thành, TP. Hồ Chí Minh',
                shippingCarrier: item.shippingCarrier,
                deliveryPriority: item.deliveryPriority,
                deliveryNote: 'Vui lòng gọi trước khi giao.',
                waybillCode: `AB-20261128-${String(item.orderId).padStart(8, '0')}`,
                packingIssue: item.packingIssue,
                items:
                    item.orderId === 2052
                        ? [
                              {
                                  bookId: 2,
                                  bookTitle: 'Lược sử vạn vật',
                                  isbn: '9786040000002',
                                  shelfLocation: 'Kệ A · Ngăn 02',
                                  bookCover: null,
                                  quantity: 1,
                                  unitPrice: 248000,
                              },
                              {
                                  bookId: 5,
                                  bookTitle: 'Dế mèn phiêu lưu ký',
                                  isbn: '9786040000005',
                                  shelfLocation: 'Kệ A · Ngăn 05',
                                  bookCover: null,
                                  quantity: 1,
                                  unitPrice: 120000,
                              },
                          ]
                        : [
                              {
                                  bookId: 6,
                                  bookTitle: 'Sapiens — Lược sử loài người',
                                  isbn: '9786040000006',
                                  shelfLocation: 'Kệ A · Ngăn 06',
                                  bookCover: null,
                                  quantity: item.totalItems,
                                  unitPrice: item.finalAmount / item.totalItems,
                              },
                          ],
            },
        ]),
    );
    const balance: PointBalance = {
        userId: 16,
        currentPoints: 1860,
        pendingPoints: 124,
        totalPointsEarned: 2350,
        totalSpent: 7850000,
        tierName: 'Bạc',
        pointRate: 10,
    };
    const tiers: MembershipTier[] = [
        {
            id: 1,
            tierName: 'Đồng',
            minSpending: 0,
            pointRate: 5,
            benefits: 'Tích điểm cho mỗi đơn hàng hợp lệ.',
        },
        {
            id: 2,
            tierName: 'Bạc',
            minSpending: 5000000,
            pointRate: 10,
            benefits: 'Tăng tỷ lệ tích điểm cho những lần mua tiếp theo.',
        },
        {
            id: 3,
            tierName: 'Vàng',
            minSpending: 20000000,
            pointRate: 15,
            benefits: 'Tận hưởng tỷ lệ tích điểm cao nhất.',
        },
    ];
    const history: PointTransaction[] = [
        {
            id: 5,
            orderId: 1054,
            pointUsed: -124,
            balanceAfter: 1860,
            transactionType: 'Earn',
            description: 'Tích điểm đơn #1054',
            createdAt: now(),
            status: 'Pending',
            availableAt: dated(3),
        },
        {
            id: 4,
            orderId: 1048,
            pointUsed: -150,
            balanceAfter: 1860,
            transactionType: 'Earn',
            description: 'Tích điểm đơn #1048',
            createdAt: dated(-2),
            status: 'Available',
            availableAt: dated(-1),
        },
        {
            id: 3,
            orderId: 1046,
            pointUsed: -10,
            balanceAfter: 1710,
            transactionType: 'Earn',
            description: 'Thưởng đánh giá sách, đơn #1046',
            createdAt: dated(-3),
            status: 'Available',
            availableAt: null,
        },
        {
            id: 2,
            orderId: 1044,
            pointUsed: 250,
            balanceAfter: 1700,
            transactionType: 'Redeem',
            description: 'Sử dụng F-Point khi thanh toán',
            createdAt: dated(-4),
            status: 'Available',
            availableAt: null,
        },
        {
            id: 1,
            orderId: 1040,
            pointUsed: -80,
            balanceAfter: 1950,
            transactionType: 'Earn',
            description: 'Điểm đơn #1040 đã yêu cầu hoàn trả',
            createdAt: dated(-5),
            status: 'Cancelled',
            availableAt: dated(-2),
        },
    ];
    const eligible: ReviewOrder[] = [
        {
            orderId: 3053,
            orderDate: dated(-2),
            books: [
                { bookId: 2, title: 'Lược sử vạn vật', coverImg: null, purchaseType: 1 },
                { bookId: 5, title: 'Dế mèn phiêu lưu ký', coverImg: null, purchaseType: 1 },
            ],
        },
        {
            orderId: 3052,
            orderDate: dated(-3),
            books: [{ bookId: 6, title: 'Sapiens — Lược sử loài người', coverImg: null, purchaseType: 2 }],
        },
    ];
    let reviews: MemberReview[] = [
        {
            id: 1,
            orderId: 1046,
            bookId: 4,
            bookTitle: 'Nhà giả kim',
            rating: 5,
            title: 'Một cuốn sách đáng đọc lại',
            content:
                'Sách được đóng gói cẩn thận, nội dung nhẹ nhàng mà sâu sắc. Một cuốn sách mình sẽ dành thời gian đọc lại.',
            imageUrls: null,
            verificationLabel: 'Đã mua sách',
            createdAt: dated(-3),
        },
    ];
    const getDelivery = (id: number) => {
        const item = deliveries.find((item) => item.orderId === id);
        if (!item) throw new Error('Không tìm thấy đơn hàng.');
        return item;
    };
    return {
        deliveries: async (query) =>
            wait(
                page(
                    deliveries
                        .filter(
                            (item) =>
                                (!query.status || item.status === query.status) &&
                                (!query.keyword ||
                                    `${item.orderCode} ${item.customerName}`
                                        .toLocaleLowerCase('vi')
                                        .includes(query.keyword.toLocaleLowerCase('vi'))),
                        )
                        .sort(
                            (a, b) =>
                                Number(['Completed', 'Failed'].includes(a.status)) -
                                    Number(['Completed', 'Failed'].includes(b.status)) ||
                                b.orderId - a.orderId,
                        ),
                    query.pageNumber,
                    query.pageSize,
                ),
            ),
        delivery: async (id) => wait(getDelivery(id)),
        updateDelivery: async (id, update) => {
            const item = getDelivery(id);
            if (!(
                (item.status === 'Prepared' && update.newStatus === 'Shipping') ||
                (item.status === 'Shipping' && ['Completed', 'Failed'].includes(update.newStatus)) ||
                (item.status === 'ReturnApproved' && update.newStatus === 'Returned')
            ))
                throw new Error('Đơn đã thay đổi trạng thái.');
            if (update.newStatus === 'Failed' && !update.failureReasonId)
                throw new Error('Vui lòng chọn lý do.');
            item.status = update.newStatus;
            item.isReadOnly = ['Completed', 'Failed', 'Returned'].includes(item.status);
            if (item.isReadOnly) item.completedAt = now();
            if (item.status === 'Completed') {
                item.isPaid = true;
                item.codAmount = 0;
            }
            if (item.status === 'Failed') {
                item.failureReason = reasons.find((r) => r.id === update.failureReasonId)?.reasonText ?? '';
                item.failureNote = update.failureNote ?? null;
            }
            return wait({});
        },
        failureReasons: async () => wait(reasons),
        packingOrders: async (query) =>
            wait(
                page(
                    packing.filter(
                        (item) =>
                            (!query.keyword ||
                                `${item.orderId} ${item.customerName}`
                                    .toLocaleLowerCase('vi')
                                    .includes(query.keyword.toLocaleLowerCase('vi'))) &&
                            (!query.fromDate || item.orderDate >= query.fromDate) &&
                            (!query.toDate || item.orderDate <= query.toDate),
                    ),
                    query.pageNumber,
                    query.pageSize,
                ),
            ),
        packingDetail: async (id) => {
            if (!details[id]) throw new Error('Không tìm thấy đơn hàng.');
            return wait(details[id]);
        },
        confirmPacking: async (id, verification) => {
            const index = packing.findIndex((item) => item.orderId === id);
            if (index < 0) throw new Error('Đơn đã được xử lý.');
            const detail = details[id];
            const verified = verification.verifiedItems.every((item) => {
                const expected = detail.items.find((book) => book.bookId === item.bookId);
                return expected
                    && item.verifiedQuantity === expected.quantity
                    && item.scannedCodes.length === expected.quantity
                    && item.visualInspectionPassed;
            });
            if (!verified) throw new Error('Vui lòng quét đủ mã và xác nhận ngoại quan từng cuốn.');
            detail.status = 3;
            detail.canConfirmPacking = false;
            detail.packedAt = now();
            detail.packedBy = 'warehouse.demo';
            packing.splice(index, 1);
            return wait({});
        },
        packingIssue: async (id, reason) => {
            if (!reason.trim() || reason.length > 1000) throw new Error('Vui lòng nhập lý do hợp lệ.');
            const item = packing.find((item) => item.orderId === id);
            if (!item) throw new Error('Đơn đã được xử lý.');
            item.packingIssue = reason;
            details[id].packingIssue = reason;
            return wait({});
        },
        balance: async () => wait(balance),
        pointHistory: async (query) => {
            const filtered = history.filter((item) =>
                (!query.fromDate || item.createdAt.slice(0, 10) >= query.fromDate)
                && (!query.toDate || item.createdAt.slice(0, 10) <= query.toDate)
                && (!query.transactionType || item.transactionType === query.transactionType));
            const result = page(filtered, query.pageNumber, query.pageSize);
            return wait({
                ...result,
                totalEarned: filtered.filter((item) => item.transactionType === 'Earn' && item.status !== 'Cancelled')
                    .reduce((sum, item) => sum + Math.abs(item.pointUsed), 0),
                totalRedeemed: filtered.filter((item) => item.transactionType === 'Redeem')
                    .reduce((sum, item) => sum + Math.abs(item.pointUsed), 0),
                totalRefunded: filtered.filter((item) => item.transactionType === 'Refund')
                    .reduce((sum, item) => sum + Math.abs(item.pointUsed), 0),
            });
        },
        tiers: async () => wait(tiers),
        previewPoints: async (pointsToUse, totalAmount) => {
            const max = Math.min(1000, balance.currentPoints, Math.floor(totalAmount / 100));
            if (!Number.isInteger(pointsToUse) || pointsToUse < 0 || pointsToUse > max)
                throw new Error(`Chỉ được dùng tối đa ${max} F-Point cho đơn này.`);
            return wait({
                pointsUsed: pointsToUse,
                maxPointsAllowed: max,
                discountAmount: pointsToUse * 100,
                finalAmount: totalAmount - pointsToUse * 100,
                message: 'Xem trước mức giảm; chưa trừ điểm.',
            });
        },
        orderPoints: async (id) => {
            const item = history.find((item) => item.orderId === id && item.transactionType === 'Earn');
            return wait({
                orderId: id,
                pendingPoints: item?.status === 'Pending' ? -item.pointUsed : 0,
                availablePoints: item?.status === 'Available' ? -item.pointUsed : 0,
                cancelledPoints: item?.status === 'Cancelled' ? -item.pointUsed : 0,
                availableAt: item?.availableAt ?? null,
                receiptConfirmedAt: null,
                canConfirmReceipt: item?.status === 'Pending',
            });
        },
        confirmReceipt: async (id) => {
            const item = history.find((item) => item.orderId === id && item.status === 'Pending');
            if (!item) throw new Error('Đơn không còn điểm chờ.');
            item.status = 'Available';
            balance.currentPoints -= item.pointUsed;
            balance.pendingPoints += item.pointUsed;
            return wait({
                orderId: id,
                pendingPoints: 0,
                availablePoints: -item.pointUsed,
                cancelledPoints: 0,
                availableAt: item.availableAt,
                receiptConfirmedAt: now(),
                canConfirmReceipt: false,
            });
        },
        myReviews: async (p, size, bookId) =>
            wait(page(bookId ? reviews.filter((review) => review.bookId === bookId) : reviews, p, size)),
        reviewOrders: async (p, size) => wait(page(eligible, p, size)),
        createReview: async (draft) => {
            const index = eligible.findIndex((item) => item.orderId === draft.orderId);
            if (index < 0 || !draft.content.trim())
                throw new Error('Giao dịch không hợp lệ hoặc đã được đánh giá.');
            const book = eligible[index].books.find((book) => book.bookId === draft.bookId)!;
            const review: MemberReview = {
                id: Date.now(),
                orderId: draft.orderId!,
                bookId: draft.bookId,
                bookTitle: book.title,
                rating: draft.rating,
                title: draft.title ?? '',
                content: draft.content,
                imageUrls: draft.imageUrls ?? null,
                verificationLabel: book.purchaseType === 1 ? 'Đã mua hàng' : 'Đã thuê sách',
                rewardPointsAwarded: 10,
                createdAt: now(),
            };
            reviews = [review, ...reviews];
            eligible.splice(index, 1);
            balance.currentPoints += 10;
            return wait({
                message: 'Gửi đánh giá thành công! Bạn được cộng thêm 10 điểm thưởng F-Point.',
                data: review,
            });
        },
        updateReview: async (id, draft) => {
            const review = reviews.find((item) => item.id === id);
            if (!review) throw new Error('Không tìm thấy đánh giá.');
            Object.assign(review, draft);
            return wait({});
        },
        deleteReview: async (id) => {
            reviews = reviews.filter((item) => item.id !== id);
            return wait({});
        },
        uploadReviewImage: async (file) => wait({ fileUrl: URL.createObjectURL(file) }),
        notifications: async () =>
            wait(
                page(
                    [
                        {
                            id: 1,
                            orderId: 1054,
                            message: 'Đơn hàng #1054 đã giao thành công. Điểm thưởng đang chờ duyệt.',
                            createdAt: now(),
                        },
                    ],
                    1,
                    20,
                ),
            ),
    };
}
