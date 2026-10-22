import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getOrderHistory, presentOrder } from '../services/orderHistoryService';
import { OrderStatus } from '../types/order';
import { bookIdOf, purchaseType } from '../utils/orderHistory';
import type { LibraryBook } from '../types/library';

export const useMyLibrary = () => {
    const { user } = useUser();
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const orders = (await getOrderHistory()).map(presentOrder);
                const result = new Map<number, LibraryBook>();
                for (const order of orders.filter(entry => entry.status === OrderStatus.Completed && entry.isPaid)) {
                    for (const item of order.orderItems) {
                        const format = purchaseType(item);
                        if (format === 'physical') continue;
                        const id = bookIdOf(item);
                        const end = item.rentalEndDate ? new Date(item.rentalEndDate).getTime() : 0;
                        const remaining = Math.ceil((end - Date.now()) / 86400000);
                        const previous = result.get(id);
                        if (previous?.type === 'owned' || previous && format !== 'ebook' && (previous.rentExpireDays ?? 0) >= remaining) continue;
                        result.set(id, { id: String(id), title: item.book?.title ?? `Sách #${id}`, author: item.book?.author ?? '', coverImg: item.book?.coverImg ?? '',
                            type: format === 'ebook' ? 'owned' : 'rented', isExpired: format !== 'ebook' && remaining <= 0,
                            rentExpireDays: remaining, lastReadProgress: 0 });
                    }
                }
                if (active) { setBooks([...result.values()]); setError(''); }
            } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải tủ sách.'); }
            finally { if (active) setLoading(false); }
        };
        void load();
        const update = () => { void load(); };
        window.addEventListener('order-history-changed', update);
        return () => { active = false; window.removeEventListener('order-history-changed', update); };
    }, [user?.id]);
    return { books, loading, error };
};
