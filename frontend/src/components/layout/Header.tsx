import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import Badge from '../common/Badge';
import { useUser } from '../../context/UserContext';
import { useAuthAction } from '../../hooks/useAuthAction';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';
import { getCart } from '../../services/bookCartService';

export interface HeaderProps {
    wishlistCount?: number;
    cartCount?: number;
    onSearch?: (keyword: string) => void;
    initialSearch?: string;
    onNavigateHome?: () => void;
    onNavigateWishlist?: () => void;
    onNavigateCart?: () => void;
    onNavigateProfile?: () => void;
    onNavigateOrders?: () => void;
    onNavigateLibrary?: () => void;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({
    wishlistCount = 0,
    cartCount: passedCartCount = 0,
    onSearch,
    initialSearch = '',
    onNavigateHome,
    onNavigateWishlist,
    onNavigateCart,
    onNavigateProfile,
    onNavigateOrders,
    onNavigateLibrary,
    className = '',
}) => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useUser();
    const { handleLogout } = useAuthAction();
    const [searchKeyword, setSearchKeyword] = useState(initialSearch);

    const [cartCount, setCartCount] = useState<number>(passedCartCount);

    useEffect(() => {
        const handleCartUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            
            if (typeof detail === 'number') {
                setCartCount(detail);
            } else {
                fetchCartCount();
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [isLoggedIn, passedCartCount]);

    const fetchCartCount = async () => {
        if (!isLoggedIn) return;
        try {
            const data = await getCart();
            setCartCount(data.items.length);
        } catch (error: any) {
            console.error(error.message || 'Lỗi khi tải giỏ hàng');
        }
    };

    useEffect(() => {
        fetchCartCount();
    }, [isLoggedIn]);

    const handleSearchTrigger = () => {
        onSearch?.(searchKeyword.trim());
    };

    const handleHomeClick = () => {
        if (onNavigateHome) onNavigateHome();
        else navigate('/');
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate('/login', { state: { from: { pathname: '/wishlist', search: '' } } });
            return;
        }
        if (onNavigateWishlist) onNavigateWishlist();
        else navigate('/wishlist');
    };

    const handleLibraryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        if (onNavigateLibrary) onNavigateLibrary();
        else navigate('/my-library');
    };

    const handleCartClick = () => {
        if (onNavigateCart) onNavigateCart();
        else navigate('/cart');
    };

    const handleNavigateOrders = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        if (onNavigateOrders) onNavigateOrders();
        else navigate('/order-history');
    };

    return (
        <header className={`${styles.storeHeader} ${className}`}>
            <div className={styles.navbarMain}>
                <div className={styles.brandLogo} onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
                    ancient<span className={styles.bookText}>BOOK</span>
                    <span className={styles.accentDot}></span>
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm sách cổ điển, tác giả, NXB hoặc mã ISBN..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                    />
                    <button type="button" className={styles.searchBtn} title="Tìm kiếm" onClick={handleSearchTrigger}>
                        <Search />
                    </button>
                </div>

                <div className={styles.navActions}>
                    <span className={styles.navActionLink} title="Sách yêu thích" onClick={handleWishlistClick} style={{ cursor: 'pointer' }}>
                        <Heart />
                        <span>Yêu thích</span>
                        {isLoggedIn && <Badge count={wishlistCount} variant="count" />}
                    </span>

                    <span className={styles.navActionLink} title="Giỏ hàng" onClick={handleCartClick} style={{ cursor: 'pointer' }}>
                        <ShoppingBag />
                        <span>Giỏ hàng</span>
                        <Badge count={cartCount} variant="count" />
                    </span>

                    <div className={styles.userMenuWrapper}>
                        <div className={styles.userDropdownTrigger}>
                            <img
                                src={
                                    user?.avatarUrl ||
                                    'https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ='
                                }
                                className={styles.userAvatarTiny}
                                alt="Avatar"
                            />
                            <span className={styles.userNameText}>
                                {isLoggedIn ? user?.fullName || user?.username : 'Tài khoản'}
                            </span>
                            <User />
                        </div>

                        <ul className={styles.userDropdownMenu}>
                            {isLoggedIn ? (
                                <>
                                    {user?.role === 'Admin' && <li className={styles.dropdownItemLink} onClick={() => navigate('/admin/reports')}>Thống kê & Báo cáo</li>}
                                    {(user?.role === 'Admin' || user?.role === 'Staff') && (
                                        <li className={styles.dropdownItemLink} onClick={() => navigate(user.role === 'Staff' ? '/staff/books' : '/admin/settings')}>
                                            {user.role === 'Staff' ? 'Quản lý sách' : 'Cài đặt hệ thống'}
                                        </li>
                                    )}
                                    <li className={styles.dropdownItemLink} onClick={onNavigateProfile || (() => navigate('/profile'))}>
                                        Hồ sơ & Đổi mật khẩu
                                    </li>
                                    <li className={styles.dropdownItemLink} onClick={handleLibraryClick}>Tủ sách của tôi</li>
                                    <li className={styles.dropdownItemLink} onClick={handleNavigateOrders}>Lịch sử đơn đặt sách</li>
                                    <li className={styles.dropdownItemLinkDanger} onClick={handleLogout}>Đăng xuất tài khoản</li>
                                </>
                            ) : (
                                <>
                                    <li className={styles.dropdownItemLink} onClick={() => navigate('/login')}>Đăng nhập</li>
                                    <li className={styles.dropdownItemLink} onClick={() => navigate('/register')}>Đăng ký tài khoản</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;