import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { deleteWishlistBook, getWishlist, saveWishlistBook } from '../services/wishlistService';
import type { ProductData } from '../types/book';
import { useToastNotifications } from './useToastNotifications';
import { useStockPolicyRefresh } from './useStockPolicyRefresh';

export const useWishlist = () => {
    const stockPolicyVersion = useStockPolicyRefresh();
    const { isLoggedIn, user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [wishlistItems, setWishlistItems] = useState<ProductData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const pending = useRef(new Set<number>());
    const generation = useRef(0);
    const { toasts, notify, dismissToast } = useToastNotifications();

    useEffect(() => {
        let active = true;
        generation.current++;
        let version = 0;
        const load = async () => {
            if (!active) return;
            const requestVersion = ++version;
            if (!isLoggedIn || user?.role !== 'Member') { setWishlistItems([]); setIsLoading(false); setError(''); return; }
            setIsLoading(true);
            setError('');
            try {
                const items = await getWishlist();
                if (active && requestVersion === version) setWishlistItems(items.map(item => ({ ...item, isWishlisted: true })));
            } catch (reason) {
                if (active && requestVersion === version) setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách yêu thích.');
            } finally { if (active && requestVersion === version) setIsLoading(false); }
        };
        void Promise.resolve().then(() => { if (active) { setWishlistItems([]); void load(); } });
        window.addEventListener('wishlist-changed', load);
        return () => { active = false; window.removeEventListener('wishlist-changed', load); };
    }, [isLoggedIn, user?.id, user?.role, stockPolicyVersion]);

    const toggleWishlist = async (book: ProductData) => {
        if (!isLoggedIn) { setLoginPromptOpen(true); return; }
        if (user?.role !== 'Member') { notify('Chức năng yêu thích dành cho tài khoản khách hàng.', 'info'); return; }
        if (pending.current.has(book.id)) return;
        pending.current.add(book.id);
        const accountGeneration = generation.current;
        try {
            const removing = wishlistItems.some(item => item.id === book.id);
            if (removing) await deleteWishlistBook(book.id);
            else await saveWishlistBook(book.id);
            if (accountGeneration !== generation.current) return;
            setWishlistItems(items => removing ? items.filter(item => item.id !== book.id) : [{ ...book, isWishlisted: true }, ...items]);
            notify(`Đã ${removing ? 'xóa' : 'thêm'} ${book.title} ${removing ? 'khỏi' : 'vào'} danh sách yêu thích.`, 'success');
            window.dispatchEvent(new Event('wishlist-changed'));
        } catch (reason) { if (accountGeneration === generation.current) notify(reason instanceof Error ? reason.message : 'Không thể cập nhật yêu thích.', 'error'); }
        finally { pending.current.delete(book.id); }
    };

    return {
        wishlistItems,
        wishlistCount: wishlistItems.length,
        wishlistIds: wishlistItems.map(item => item.id),
        toggleWishlist,
        isLoading,
        error,
        loginPromptOpen,
        closeLoginPrompt: () => setLoginPromptOpen(false),
        goToLogin: () => navigate('/login', { state: { from: location } }),
        toasts,
        dismissToast,
    };
};
