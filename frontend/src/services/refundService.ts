import { requestApi } from './apiClient';
import type { RefundRequest, RefundResponse, PagedResult, RefundResponseDto } from '../types/refund';

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

export const refundService = {
    getPagedRefunds: async (pageNumber: number, pageSize: number, searchKeyword?: string) => {
        const queryParams = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
        });
        
        if (searchKeyword) {
            queryParams.append('searchKeyword', searchKeyword);
        }

        return requestApi<PagedResult<RefundResponseDto>>(`/Refund?${queryParams.toString()}`);
    },

    getRefundByOrderId: async (orderId: number) => {
        return requestApi<RefundResponseDto>(`/Refund/order/${orderId}`);
    },

    approveRefund: async (orderId: number) => {
        return requestApi<{ message: string }>(`/Order/${orderId}/approve-refund`, {
            method: 'PUT'
        });
    }
};