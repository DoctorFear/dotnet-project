import React, { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import { useUser } from '../context/UserContext';
import type { LibraryBook } from '../types/library';

export const MyLibraryPage: React.FC = () => {
    const { isLoggedIn } = useUser();
    const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [libraryBooks] = useState<LibraryBook[]>([
        {
            id: 'B01',
            title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
            author: 'Vũ Trọng Phụng',
            coverImg: 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
            type: 'rented',
            rentExpireDays: 5,
            isExpired: false,
            lastReadProgress: 42,
        },
        {
            id: 'B02',
            title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
            author: 'Fyodor Dostoevsky',
            coverImg: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
            type: 'owned',
            isExpired: false,
            lastReadProgress: 88,
        },
        {
            id: 'B03',
            title: 'Vụ Án Mạng Trên Chuyến Tàu Tốc Hành Phương Đông',
            author: 'Agatha Christie',
            coverImg: 'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
            type: 'rented',
            rentExpireDays: 0,
            isExpired: true,
            lastReadProgress: 15,
        },
    ]);

    if (!isLoggedIn) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F7FF' }}>
                <TopBar />
                <Header />
                <Navbar />
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <h2>Vui lòng đăng nhập để xem Tủ sách cá nhân!</h2>
                    <button
                        type="button"
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            background: '#0B409C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 700,
                        }}
                        onClick={() => alert('Chuyển hướng đến trang đăng nhập')}
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    const filteredBooks = libraryBooks.filter((book) => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'active') return matchesSearch && !book.isExpired;
        return matchesSearch && book.isExpired;
    });

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F7FF' }}>
            <TopBar />
            <Header />
            <Navbar />

            <main style={{ maxWidth: '1200px', width: '100%', margin: '24px auto', padding: '0 24px', flex: 1 }}>
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', link: '/' },
                        { label: 'Tủ sách cá nhân' },
                    ]}
                />

                <div style={{ background: '#fff', border: '1px solid #dce6f7', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #dce6f7', marginBottom: '20px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0D226B', margin: 0 }}>Tủ Sách Cá Nhân Của Tôi</h1>
                        <input
                            type="text"
                            placeholder="Tìm sách trong tủ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '7px 14px', border: '1px solid #dce6f7', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '260px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #dce6f7' }}>
                        <button
                            type="button"
                            style={{
                                padding: '10px 4px',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: activeTab === 'active' ? '#0B409C' : '#5b6e99',
                                border: 'none',
                                background: 'none',
                                borderBottom: activeTab === 'active' ? '2px solid #0B409C' : '2px solid transparent',
                                cursor: 'pointer',
                            }}
                            onClick={() => setActiveTab('active')}
                        >
                            Sách Hiện Có
                        </button>
                        <button
                            type="button"
                            style={{
                                padding: '10px 4px',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: activeTab === 'expired' ? '#0B409C' : '#5b6e99',
                                border: 'none',
                                background: 'none',
                                borderBottom: activeTab === 'expired' ? '2px solid #0B409C' : '2px solid transparent',
                                cursor: 'pointer',
                            }}
                            onClick={() => setActiveTab('expired')}
                        >
                            Sách Thuê Đã Hết Hạn
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                        {filteredBooks.length > 0 ? (
                            filteredBooks.map((book) => (
                                <div key={book.id} style={{ background: '#fff', border: '1px solid #dce6f7', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ width: '100%', height: '180px', background: '#fafcff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow: 'hidden' }}>
                                        <img src={book.coverImg} alt={book.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>

                                    <div>
                                        {book.type === 'owned' ? (
                                            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                                Đã mua
                                            </span>
                                        ) : (
                                            <span style={{ background: '#f3e8ff', color: '#6b21a8', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                                {book.isExpired ? 'Đã hết hạn' : `Thuê còn ${book.rentExpireDays} ngày`}
                                            </span>
                                        )}
                                    </div>

                                    <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0D226B', margin: 0, lineHeight: '1.4', height: '38px', overflow: 'hidden' }}>
                                        {book.title}
                                    </h4>
                                    <span style={{ fontSize: '12px', color: '#5b6e99' }}>{book.author}</span>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5b6e99' }}>
                                            <span>Tiến trình đọc:</span>
                                            <strong>{book.lastReadProgress}%</strong>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                                            <div style={{ height: '100%', background: '#0B409C', width: `${book.lastReadProgress}%` }} />
                                        </div>
                                    </div>

                                    {!book.isExpired ? (
                                        <button
                                            type="button"
                                            style={{ width: '100%', padding: '9px', background: '#0B409C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: 'auto' }}
                                            onClick={() => alert(`Đang mở giao diện E-Book Reader đọc sách: ${book.title}`)}
                                        >
                                            Đọc Sách Online
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            style={{ width: '100%', padding: '9px', background: '#F2F7FF', color: '#0B409C', border: '1px solid #0B409C', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: 'auto' }}
                                            onClick={() => (window.location.href = `/books/${book.id}`)}
                                        >
                                            Gia Hạn Gói Thuê
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#5b6e99', gridColumn: '1 / -1' }}>
                                Không tìm thấy cuốn sách nào trong danh mục này.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyLibraryPage;