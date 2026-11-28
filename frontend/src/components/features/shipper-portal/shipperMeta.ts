import type { DeliveryStatus } from '../../../types/workflow';

export const statusText: Record<DeliveryStatus, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Prepared: 'Chờ lấy hàng',
    Shipping: 'Đang giao',
    Completed: 'Hoàn thành',
    Failed: 'Thất bại',
    ReturnRequested: 'Chờ duyệt hoàn trả',
    ReturnApproved: 'Đang chờ thu hồi',
    Returned: 'Thu hồi thành công',
};

export const tabs = [
    { value: '', label: 'Tất cả' },
    ...(['Prepared', 'Shipping', 'ReturnApproved', 'Completed', 'Failed', 'Returned'] as const).map((value) => ({
        value,
        label: statusText[value],
    })),
];
