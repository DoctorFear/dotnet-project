import React, { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import SidebarFilter from '../components/features/storefront/SidebarFilter';
import type { FilterParams } from '../components/features/storefront/SidebarFilter';
import BookGrid from '../components/features/storefront/BookGrid';
import type { ProductData } from '../types/product';

export const HomePage: React.FC = () => {
    const [wishlistIds, setWishlistIds] = useState<string[]>(['B01', 'B03']);
    const [sortBy, setSortBy] = useState<string>('newest');

    const initialBooks: ProductData[] = [
        {
            id: 'B01',
            title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
            author: 'Vũ Trọng Phụng',
            coverImg: 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
            isPhysicalAvailable: true,
            physicalPrice: 85000,
            isEBookAvailable: true,
            eBookPrice: 45000,
            isRentalAvailable: true,
            weeklyRentalPrice: 15000,
            monthlyRentalPrice: 35000,
            yearlyRentalPrice: 95000,
            rating: 4.8,
            reviewsCount: 124,
            stockStatus: 'low_stock',
            stockCount: 3,
        },
        {
            id: 'B02',
            title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
            author: 'Fyodor Dostoevsky',
            coverImg: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
            isPhysicalAvailable: true,
            physicalPrice: 145000,
            isEBookAvailable: true,
            eBookPrice: 75000,
            isRentalAvailable: false,
            rating: 4.9,
            reviewsCount: 89,
            stockStatus: 'in_stock',
        },
        {
            id: 'B03',
            title: 'Vụ Án Mạng Trên Chuyến Tàu Tốc Hành Phương Đông',
            author: 'Agatha Christie',
            coverImg: 'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
            isPhysicalAvailable: true,
            physicalPrice: 98000,
            isEBookAvailable: false,
            isRentalAvailable: true,
            weeklyRentalPrice: 20000,
            monthlyRentalPrice: 45000,
            yearlyRentalPrice: 110000,
            rating: 4.7,
            reviewsCount: 210,
            stockStatus: 'low_stock',
            stockCount: 5,
        },
    ];

    const handleToggleWishlist = (id: string) => {
        setWishlistIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <>
            <style>{`
        .ab-home-page-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--alice, #F2F7FF);
        }

        .ab-storefront-container {
          max-width: 1200px;
          width: 100%;
          margin: 24px auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .ab-storefront-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

            <div className="ab-home-page-layout">
                <TopBar />
                <Header wishlistCount={wishlistIds.length} cartCount={2} />
                <Navbar />

                <main className="ab-storefront-container">
                    <SidebarFilter
                        onFilterChange={(filters: Partial<FilterParams>) => console.log('Filters:', filters)}
                        onResetFilters={() => console.log('Reset Filters')}
                    />
                    <BookGrid
                        books={initialBooks}
                        wishlistIds={wishlistIds}
                        sortBy={sortBy}
                        onSortChange={(val) => setSortBy(val)}
                        onToggleWishlist={handleToggleWishlist}
                        onSelectBook={(id) => (window.location.href = `/books/${id}`)}
                        onAddToCart={(id) => alert(`Đã thêm sách vật lý ${id} vào giỏ hàng!`)}
                    />
                </main>
            </div>
        </>
    );
};

export default HomePage;