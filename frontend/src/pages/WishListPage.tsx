import React from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductCard from '../components/common/ProductCard';
import { useWishlist } from '../hooks/useWishList'; 
import { useUser } from '../context/UserContext';
import type { ProductData } from '../types/product';

interface WishListPageProps {
    onLoginClick?: () => void;
}

const INITIAL_WISHLIST: ProductData[] = [
    {
        id: 'B01',
        title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
        author: 'Vũ Trọng Phụng',
        publisher: 'NXB Văn Học',
        categories: ['Văn học Việt Nam', 'Tiểu thuyết Trào phúng'],
        coverImg: 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
        isPhysicalAvailable: true,
        physicalPrice: 85000,
        isEBookAvailable: true,
        eBookPrice: 45000,
        rating: 4.8,
        reviewsCount: 124,
        stockStatus: 'low_stock',
        stockCount: 3,
        isWishlisted: true,
    },
    {
        id: 'B02',
        title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
        author: 'Fyodor Dostoevsky',
        publisher: 'NXB Tri Thức',
        categories: ['Văn học Cổ điển', 'Tâm lý học'],
        coverImg: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
        isPhysicalAvailable: true,
        physicalPrice: 145000,
        isEBookAvailable: true,
        eBookPrice: 75000,
        rating: 4.9,
        reviewsCount: 89,
        stockStatus: 'in_stock',
        stockCount: 15,
        isWishlisted: true,
    },
];

export const WishListPage: React.FC<WishListPageProps> = ({ onLoginClick }) => {
    const { isLoggedIn } = useUser();
    const { wishlistItems, wishlistCount, removeWishlistItem } = useWishlist(INITIAL_WISHLIST);

    if (!isLoggedIn) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F7FF' }}>
                <TopBar />
                <Header onLoginClick={onLoginClick} />
                <Navbar />
                <main style={{ maxWidth: '1200px', width: '100%', margin: '40px auto', padding: '0 24px', flex: 1 }}>
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #dce6f7',
                            borderRadius: '12px',
                            padding: '60px 24px',
                            textAlign: 'center',
                            boxShadow: '0 4px 16px -4px rgba(7, 18, 51, 0.04)',
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
                        <h2 style={{ color: '#0D226B', fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
                            Vui lòng đăng nhập để xem danh sách Yêu thích!
                        </h2>
                        <button
                            type="button"
                            style={{
                                padding: '11px 28px',
                                background: '#0B409C',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '14px',
                            }}
                            onClick={onLoginClick || (() => alert('Chuyển hướng sang trang đăng nhập'))}
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F7FF' }}>
            <TopBar />
            <Header wishlistCount={wishlistCount} />
            <Navbar />

            <main style={{ maxWidth: '1200px', width: '100%', margin: '24px auto', padding: '0 24px', flex: 1 }}>
                <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Danh sách yêu thích' }]} />

                <div style={{ background: '#ffffff', border: '1px solid #dce6f7', borderRadius: '12px', padding: '24px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: '16px',
                            borderBottom: '1px solid #dce6f7',
                            marginBottom: '20px',
                        }}
                    >
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0D226B', margin: 0 }}>
                        Danh Sách Sách Yêu Thích
                    </h1>
                    <span style={{ fontSize: '13px', color: '#5b6e99' }}>
                        Đang lưu <strong>{wishlistCount}</strong> sản phẩm
                    </span>
                </div>

                {wishlistCount > 0 ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '20px',
                        }}
                    >
                        {wishlistItems.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onToggleWishlist={() => removeWishlistItem(product.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#5b6e99' }}>
                        Chưa có sản phẩm yêu thích nào trong danh sách.
                    </div>
                )}
        </div>
      </main >
    </div >
  );
};

export default WishListPage;