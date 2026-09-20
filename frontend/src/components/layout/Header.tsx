import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import Badge from '../common/Badge';
import { useUser } from '../../context/UserContext';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';

export interface HeaderProps {
    wishlistCount?: number;
    cartCount?: number;
    onSearch?: (keyword: string) => void;
    onNavigateHome?: () => void;
    onNavigateWishlist?: () => void;
    onNavigateCart?: () => void;
    onNavigateProfile?: () => void;
    onNavigateOrders?: () => void;
    onNavigateLibrary?: () => void;
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({
    wishlistCount = 0,
    cartCount = 2,
    onSearch,
    onNavigateHome,
    onNavigateWishlist,
    onNavigateCart,
    onNavigateProfile,
    onNavigateOrders,
    onNavigateLibrary,
    onLoginClick,
    onRegisterClick,
    className = '',
}) => {
    const navigate = useNavigate();
    // Tự động lấy trạng thái đăng nhập & username từ UserContext gốc
    const { isLoggedIn, user, logout } = useUser();
    const [searchKeyword, setSearchKeyword] = useState('');

    const handleSearchTrigger = () => {
        if (searchKeyword.trim()) {
            onSearch?.(searchKeyword.trim());
        }
    };

    const handleHomeClick = () => {
        if (onNavigateHome) onNavigateHome();
        else navigate('/');
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert('Vui lòng đăng nhập để xem danh sách Yêu thích!');
            onLoginClick?.();
            return;
        }
        if (onNavigateWishlist) onNavigateWishlist();
        else navigate('/wishlist');
    };

    const handleLibraryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert('Vui lòng đăng nhập để truy cập Tủ sách cá nhân!');
            onLoginClick?.();
            return;
        }
        if (onNavigateLibrary) onNavigateLibrary();
        else navigate('/my-library');
    };

    const handleCartClick = () => {
        if (onNavigateCart) onNavigateCart();
        else navigate('/cart');
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
                        <Search/>
                    </button>
                </div>

                <div className={styles.navActions}>
                    <span className={styles.navActionLink} title="Sách yêu thích" onClick={handleWishlistClick} style={{ cursor: 'pointer' }}>
                        <Heart/>
                        <span>Yêu thích</span>
                        {isLoggedIn && <Badge count={wishlistCount} variant="count" />}
                    </span>

                    <span className={styles.navActionLink} title="Giỏ hàng" onClick={handleCartClick} style={{ cursor: 'pointer' }}>
                        <ShoppingBag/>
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
                                {isLoggedIn ? user?.username || 'Tài khoản' : 'Tài khoản'}
                            </span>
                            <User/>
                        </div>

                        <ul className={styles.userDropdownMenu}>
                            {isLoggedIn ? (
                                <>
                                    <li className={styles.dropdownItemLink} onClick={onNavigateProfile}>Hồ sơ & Đổi mật khẩu</li>
                                    <li className={styles.dropdownItemLink} onClick={handleLibraryClick}>Tủ sách của tôi</li>
                                    <li className={styles.dropdownItemLink} onClick={onNavigateOrders}>Lịch sử đơn đặt sách</li>
                                    <li className={styles.dropdownItemLinkDanger} onClick={logout}>Đăng xuất tài khoản</li>
                                </>
                            ) : (
                                <>
                                    <li className={styles.dropdownItemLink} onClick={onLoginClick}>Đăng nhập</li>
                                    <li className={styles.dropdownItemLink} onClick={onRegisterClick}>Đăng ký tài khoản</li>
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