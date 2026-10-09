import { useCallback, useState } from 'react';
import type { ToastMessage } from '../components/common/ToastNotification';

export const useToastNotifications = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const notify = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
        setToasts((current) => [...current, { id: crypto.randomUUID(), message, type }]);
    }, []);
    const dismissToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);
    return { toasts, notify, dismissToast };
};
