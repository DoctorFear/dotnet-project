import { useState } from 'react';
import { submitRefundRequest } from '../services/refundService';
import type { RefundRequest } from '../types/refund';
import { useToastNotifications } from './useToastNotifications';

export const useRefund = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { notify, toasts, dismissToast } = useToastNotifications();

    const submitRefund = async (data: RefundRequest, onSuccess?: () => void) => {
        setIsLoading(true);
        try {
            const response = await submitRefundRequest(data);
            notify(response.message || 'Gửi yêu cầu hoàn tiền thành công!', 'success');
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            notify(
                error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi yêu cầu hoàn tiền.', 
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        submitRefund,
        isLoading,
        toasts,
        dismissToast
    };
};