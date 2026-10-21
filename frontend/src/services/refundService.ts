import { requestApi } from './apiClient';
import type { RefundRequest, RefundResponse } from '../types/refund';

export const submitRefundRequest = async (data: RefundRequest): Promise<RefundResponse> => {
    const formData = new FormData();
    formData.append('orderId', data.orderId.toString());
    formData.append('reason', data.reason);
    formData.append('shippingMethod', data.shippingMethod);
    formData.append('description', data.description);
    formData.append('bankAccount', data.bankAccount);
    
    if (data.images && data.images.length > 0) {
        data.images.forEach(img => formData.append('Images', img));
    }
    
    if (data.video) {
        formData.append('Video', data.video);
    }
    
    return requestApi<{ message: string, success: boolean }>(`/refund/request`, { method: 'POST', body: formData });
};