import type { DeliveryStatus } from '../../../types/workflow';

export const statusText: Record<DeliveryStatus, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Prepared: 'Chờ lấy hàng',
    Shipping: 'Đang giao',
    Completed: 'Hoàn thành',
    Failed: 'Thất bại',
    ReturnRequested: 'Chờ duyệt hoàn trả',
    ReturnApproved: 'Đã duyệt hoàn trả',
    Returned: 'Hoàn trả thành công',
};

export const tabs = [
    { value: '', label: 'Tất cả' },
    ...(['Prepared', 'Shipping', 'Completed', 'Failed'] as const).map((value) => ({
        value,
        label: statusText[value],
    })),
];
