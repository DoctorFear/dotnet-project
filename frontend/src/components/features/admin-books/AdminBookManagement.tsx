import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    BookOpen,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    FolderTree,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
    Lock,
    Ban,
} from 'lucide-react';
import type { AdminBookData, AdminBookStatus } from '../../../types/adminBook';
import type { CategoryData } from '../../../types/category';
import type { PublisherData } from '../../../types/publisher';
import ToastNotification from '../../common/ToastNotification';
import type { ToastMessage } from '../../common/ToastNotification';
import styles from './AdminBookManagement.module.css';

type AdminBookTab = 'books' | 'categories' | 'publishers';
type ModalKind = AdminBookTab | null;

type DraftValue = string | number | number[] | AdminBookStatus | null | undefined;
type DraftFormState = Record<string, DraftValue>;

interface ConfirmState {
    kind: AdminBookTab;
    id: string | number;
    title: string;
}

const PAGE_SIZE = 5;

// <Dữ liệu mẫu Thể loại>
const initialCategories: CategoryData[] = [
    { id: 1, name: 'Văn học', parentId: null, description: 'Nhóm danh mục văn học tổng hợp', bookCount: 5 },
    { id: 2, name: 'Tiểu thuyết', parentId: 1, description: 'Tiểu thuyết trong và ngoài nước', bookCount: 3 },
    { id: 3, name: 'Trinh thám', parentId: 1, description: 'Tác phẩm phá án, bí ẩn', bookCount: 1 },
    { id: 4, name: 'Kinh tế', parentId: null, description: 'Sách kinh tế và quản trị', bookCount: 0 },
];

// <Dữ liệu mẫu Nhà xuất bản>
const initialPublishers: PublisherData[] = [
    { id: 1, name: 'NXB Văn Học', address: '18 Nguyễn Trường Tộ, Hà Nội', phone: '02438221435', email: 'contact@vanhoc.vn', bookCount: 1 },
    { id: 2, name: 'NXB Tri Thức', address: '53 Nguyễn Du, Hà Nội', phone: '02439421219', email: 'info@trithuc.vn', bookCount: 1 },
    { id: 3, name: 'NXB Trẻ', address: '161B Lý Chính Thắng, TP.HCM', phone: '02839316289', email: 'nxbtre@tre.vn', bookCount: 1 },
];

// <Dữ liệu mẫu Sách hệ thống>
const initialBooks: AdminBookData[] = [
    {
        id: 'B01',
        isbn: '978-604-976-123-4',
        title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
        author: 'Vũ Trọng Phụng',
        publisherId: 1,
        categoryIds: [1, 2],
        coverImg: 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
        physicalPrice: 85000,
        eBookPrice: 45000,
        weeklyRentalPrice: 15000,
        monthlyRentalPrice: 35000,
        yearlyRentalPrice: 95000,
        stockCount: 3,
        status: 'selling',
        orderCount: 4,
    },
    {
        id: 'B02',
        isbn: '978-604-887-221-7',
        title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
        author: 'Fyodor Dostoevsky',
        publisherId: 2,
        categoryIds: [1, 2],
        coverImg: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
        physicalPrice: 145000,
        eBookPrice: 0,
        weeklyRentalPrice: 0,
        monthlyRentalPrice: 0,
        yearlyRentalPrice: 0,
        stockCount: 15,
        status: 'selling',
        orderCount: 0,
    },
    {
        id: 'B03',
        isbn: '978-604-998-777-9',
        title: 'Vụ Án Mạng Trên Chuyến Tàu Tốc Hành Phương Đông',
        author: 'Agatha Christie',
        publisherId: 3,
        categoryIds: [1, 3],
        coverImg: 'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
        physicalPrice: 98000,
        eBookPrice: 68000,
        weeklyRentalPrice: 20000,
        monthlyRentalPrice: 45000,
        yearlyRentalPrice: 110000,
        stockCount: 5,
        status: 'upcoming',
        orderCount: 0,
    },
];

const statusLabels: Record<AdminBookStatus, string> = {
    selling: 'Đang bán',
    upcoming: 'Sắp phát hành',
    stopped: 'Ngừng bán',
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const AdminBookManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminBookTab>('books');
    const [books, setBooks] = useState<AdminBookData[]>(initialBooks);
    const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
    const [publishers, setPublishers] = useState<PublisherData[]>(initialPublishers);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [modalKind, setModalKind] = useState<ModalKind>(null);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [draft, setDraft] = useState<DraftFormState>({});
    const [formWarn, setFormWarn] = useState('');
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Lắng nghe click ngoài màn hình để tự đóng dropdown thể loại
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const newToast: ToastMessage = { id: Date.now().toString(), message, type };
        setToasts((prev) => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const categoryNameMap = useMemo(
        () => new Map(categories.map((cat) => [cat.id, cat.name])),
        [categories]
    );

    const publisherNameMap = useMemo(
        () => new Map(publishers.map((pub) => [pub.id, pub.name])),
        [publishers]
    );

    const stats = useMemo(() => {
        return {
            total: books.length,
            selling: books.filter((b) => b.status === 'selling').length,
            upcoming: books.filter((b) => b.status === 'upcoming').length,
            stopped: books.filter((b) => b.status === 'stopped').length,
        };
    }, [books]);

    // Lọc dữ liệu theo từng Tab
    const filteredItems = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        if (activeTab === 'books') {
            return books.filter((book) => {
                const publisherName = publisherNameMap.get(book.publisherId) || '';
                const categoryNames = book.categoryIds.map((id) => categoryNameMap.get(id) || '').join(' ');
                const matchesText = !q || `${book.title} ${book.author} ${book.isbn} ${publisherName} ${categoryNames}`.toLowerCase().includes(q);
                const matchesStatus = !statusFilter || book.status === statusFilter;
                return matchesText && matchesStatus;
            });
        }

        if (activeTab === 'categories') {
            return categories.filter((cat) => !q || `${cat.name} ${cat.description || ''}`.toLowerCase().includes(q));
        }

        return publishers.filter((pub) => !q || `${pub.name} ${pub.address || ''} ${pub.phone || ''} ${pub.email || ''}`.toLowerCase().includes(q));
    }, [activeTab, books, categories, categoryNameMap, publishers, publisherNameMap, searchText, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const resetListState = (tab: AdminBookTab) => {
        setActiveTab(tab);
        setSearchText('');
        setStatusFilter('');
        setPage(1);
    };

    const updateDraft = (key: string, value: DraftValue) => {
        setDraft((prev) => {
            const updated = { ...prev, [key]: value };

            if (key === 'eBookPrice') {
                const ebookVal = Number(value || 0);
                if (ebookVal <= 0) {
                    updated.weeklyRentalPrice = 0;
                    updated.monthlyRentalPrice = 0;
                    updated.yearlyRentalPrice = 0;
                }
            }

            return updated;
        });
    };

    // TÍNH NĂNG MỚI: Xử lý chọn/bỏ chọn Thể loại trong Dropdown Checkbox
    const toggleCategorySelection = (categoryId: number) => {
        const currentCategoryIds = (draft.categoryIds as number[]) || [];
        const updatedCategoryIds = currentCategoryIds.includes(categoryId)
            ? currentCategoryIds.filter((id) => id !== categoryId)
            : [...currentCategoryIds, categoryId];

        setDraft((prev) => ({ ...prev, categoryIds: updatedCategoryIds }));
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormWarn('');

        if (activeTab === 'books') {
            setDraft({
                id: `B${String(books.length + 1).padStart(2, '0')}`,
                title: '',
                author: '',
                isbn: '',
                publisherId: publishers[0]?.id || 1,
                categoryIds: [], // Để trống để người dùng chọn tùy ý, không khóa cứng ở Văn học
                coverImg: '',
                physicalPrice: 0,
                eBookPrice: 0,
                weeklyRentalPrice: 0,
                monthlyRentalPrice: 0,
                yearlyRentalPrice: 0,
                stockCount: 0,
                status: 'selling',
            });
        } else if (activeTab === 'categories') {
            setDraft({ name: '', parentId: '', description: '' });
        } else if (activeTab === 'publishers') {
            setDraft({ name: '', address: '', phone: '', email: '', description: '' });
        }

        setModalKind(activeTab);
    };

    const openEditModal = (kind: AdminBookTab, id: string | number) => {
        setEditingId(id);
        setFormWarn('');
        setModalKind(kind);

        if (kind === 'books') {
            const book = books.find((item) => item.id === id);
            if (!book) return;
            setDraft({
                id: book.id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                publisherId: book.publisherId,
                categoryIds: [...book.categoryIds], // Nạp đầy đủ thể loại của sách
                coverImg: book.coverImg,
                physicalPrice: book.physicalPrice,
                eBookPrice: book.eBookPrice,
                weeklyRentalPrice: book.weeklyRentalPrice,
                monthlyRentalPrice: book.monthlyRentalPrice || 0,
                yearlyRentalPrice: book.yearlyRentalPrice || 0,
                stockCount: book.stockCount,
                status: book.status,
            });
        } else if (kind === 'categories') {
            const cat = categories.find((item) => item.id === id);
            if (!cat) return;
            setDraft({ name: cat.name, parentId: cat.parentId || '', description: cat.description || '' });
        } else if (kind === 'publishers') {
            const pub = publishers.find((item) => item.id === id);
            if (!pub) return;
            setDraft({ name: pub.name, address: pub.address || '', phone: pub.phone || '', email: pub.email || '', description: pub.description || '' });
        }
    };

    const closeModal = () => {
        setModalKind(null);
        setEditingId(null);
        setFormWarn('');
        setIsCategoryDropdownOpen(false);
    };

    const saveModal = () => {
        if (modalKind === 'books') saveBook();
        if (modalKind === 'categories') saveCategory();
        if (modalKind === 'publishers') savePublisher();
    };

    const saveBook = () => {
        const titleStr = typeof draft.title === 'string' ? draft.title.trim() : '';
        const isbnStr = typeof draft.isbn === 'string' ? draft.isbn.trim() : '';
        const categoryIds = (draft.categoryIds as number[]) || [];

        if (!titleStr || !isbnStr || !draft.publisherId || categoryIds.length === 0) {
            setFormWarn('Vui lòng nhập Tên sách, ISBN, chọn NXB và chọn ít nhất 1 Thể loại.');
            return;
        }

        const duplicatedIsbn = books.some((b) => b.isbn === isbnStr && b.id !== editingId);
        if (duplicatedIsbn) {
            setFormWarn('Mã ISBN đã tồn tại trong hệ thống.');
            return;
        }

        const eBookPriceVal = Number(draft.eBookPrice || 0);

        const nextBook: AdminBookData = {
            id: String(draft.id || `B${Date.now()}`),
            title: titleStr,
            author: (typeof draft.author === 'string' && draft.author.trim()) || 'Chưa cập nhật',
            isbn: isbnStr,
            publisherId: Number(draft.publisherId),
            categoryIds,
            coverImg: (typeof draft.coverImg === 'string' && draft.coverImg.trim()) || 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
            physicalPrice: Number(draft.physicalPrice || 0),
            eBookPrice: eBookPriceVal,
            weeklyRentalPrice: eBookPriceVal > 0 ? Number(draft.weeklyRentalPrice || 0) : 0,
            monthlyRentalPrice: eBookPriceVal > 0 ? Number(draft.monthlyRentalPrice || 0) : 0,
            yearlyRentalPrice: eBookPriceVal > 0 ? Number(draft.yearlyRentalPrice || 0) : 0,
            stockCount: editingId ? Number(draft.stockCount || 0) : 0,
            status: draft.status as AdminBookStatus,
            orderCount: books.find((b) => b.id === editingId)?.orderCount || 0,
        };

        setBooks((prev) => (editingId ? prev.map((b) => (b.id === editingId ? nextBook : b)) : [nextBook, ...prev]));
        closeModal();
        addToast(editingId ? 'Cập nhật thông tin Sách thành công.' : 'Thêm sách mới thành công.', 'success');
    };

    const saveCategory = () => {
        const name = typeof draft.name === 'string' ? draft.name.trim() : '';
        if (!name) {
            setFormWarn('Tên danh mục không được để trống.');
            return;
        }

        const nextCategory: CategoryData = {
            id: typeof editingId === 'number' ? editingId : Math.max(0, ...categories.map((i) => i.id)) + 1,
            name,
            parentId: draft.parentId ? Number(draft.parentId) : null,
            description: (draft.description as string) || null,
            bookCount: categories.find((c) => c.id === editingId)?.bookCount || 0,
        };

        setCategories((prev) => (editingId ? prev.map((c) => (c.id === editingId ? nextCategory : c)) : [nextCategory, ...prev]));
        closeModal();
        addToast(editingId ? 'Cập nhật danh mục thành công.' : 'Thêm danh mục thể loại thành công.', 'success');
    };

    const savePublisher = () => {
        const name = typeof draft.name === 'string' ? draft.name.trim() : '';
        if (!name) {
            setFormWarn('Tên NXB không được để trống.');
            return;
        }

        const nextPublisher: PublisherData = {
            id: typeof editingId === 'number' ? editingId : Math.max(0, ...publishers.map((i) => i.id)) + 1,
            name,
            address: (draft.address as string) || null,
            phone: (draft.phone as string) || null,
            email: (draft.email as string) || null,
            description: (draft.description as string) || null,
            bookCount: publishers.find((p) => p.id === editingId)?.bookCount || 0,
        };

        setPublishers((prev) => (editingId ? prev.map((p) => (p.id === editingId ? nextPublisher : p)) : [nextPublisher, ...prev]));
        closeModal();
        addToast(editingId ? 'Cập nhật NXB thành công.' : 'Thêm nhà xuất bản thành công.', 'success');
    };

    const confirmDelete = () => {
        if (!confirmState) return;

        if (confirmState.kind === 'books') {
            const book = books.find((b) => b.id === confirmState.id);
            if (book?.orderCount && book.orderCount > 0) {
                setBooks((prev) => prev.map((item) => (item.id === confirmState.id ? { ...item, status: 'stopped' } : item)));
                addToast('Sách đã phát sinh đơn hàng nên hệ thống chuyển sang trạng thái Ngừng bán.', 'info');
            } else {
                setBooks((prev) => prev.filter((item) => item.id !== confirmState.id));
                addToast('Xóa Sách thành công.', 'success');
            }
        } else if (confirmState.kind === 'categories') {
            setCategories((prev) => prev.filter((item) => item.id !== confirmState.id));
            addToast('Xóa thể loại danh mục thành công.', 'success');
        } else if (confirmState.kind === 'publishers') {
            setPublishers((prev) => prev.filter((item) => item.id !== confirmState.id));
            addToast('Xóa nhà xuất bản thành công.', 'success');
        }

        setConfirmState(null);
    };

    const renderStatusBadge = (status: AdminBookStatus) => {
        const className = status === 'selling' ? styles.statusSelling : status === 'upcoming' ? styles.statusUpcoming : styles.statusStopped;
        return <span className={`${styles.statusBadge} ${className}`}>{statusLabels[status]}</span>;
    };

    // Tự động hiển thị chuỗi danh sách các thể loại đã được chọn
    const selectedCategoriesText = useMemo(() => {
        const selectedIds = (draft.categoryIds as number[]) || [];
        if (selectedIds.length === 0) return 'Chọn các thể loại...';
        return selectedIds.map((id) => categoryNameMap.get(id)).filter(Boolean).join(', ');
    }, [draft.categoryIds, categoryNameMap]);

    const isEBookDisabled = Number(draft.eBookPrice || 0) <= 0;

    return (
        <>
            <ToastNotification toasts={toasts} onClose={removeToast} />

            {/* Thống kê KPI */}
            <section className={styles.statsGrid}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>TỔNG SỐ SÁCH</span>
                    <span className={styles.statValue}>{stats.total}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>ĐANG KINH DOANH</span>
                    <span className={styles.statValue}>{stats.selling}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>SẮP PHÁT HÀNH</span>
                    <span className={styles.statValue}>{stats.upcoming}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>NGỪNG BÁN</span>
                    <span className={styles.statValue}>{stats.stopped}</span>
                </div>
            </section>

            <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.tabRow}>
                        <button
                            type="button"
                            className={`${styles.tabButton} ${activeTab === 'books' ? styles.active : ''}`}
                            onClick={() => resetListState('books')}
                        >
                            <BookOpen size={16} /> Quản lý đầu sách
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`}
                            onClick={() => resetListState('categories')}
                        >
                            <FolderTree size={16} /> Quản lý danh mục thể loại
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabButton} ${activeTab === 'publishers' ? styles.active : ''}`}
                            onClick={() => resetListState('publishers')}
                        >
                            <Building2 size={16} /> Quản lý NXB
                        </button>
                    </div>

                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <Search size={16} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={
                                    activeTab === 'books'
                                        ? 'Tìm theo tên sách, tác giả, ISBN...'
                                        : activeTab === 'categories'
                                            ? 'Tìm theo tên danh mục, mô tả...'
                                            : 'Tìm theo tên NXB, địa chỉ, email...'
                                }
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            {activeTab === 'books' && (
                                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="selling">Đang bán</option>
                                    <option value="upcoming">Sắp phát hành</option>
                                    <option value="stopped">Ngừng bán</option>
                                </select>
                            )}
                            <button type="button" className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus size={16} /> {activeTab === 'books' ? 'Thêm sách mới' : activeTab === 'categories' ? 'Thêm danh mục' : 'Thêm NXB'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 1. BẢNG DỮ LIỆU SÁCH */}
                {activeTab === 'books' && (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Đầu sách</th>
                                <th>NXB</th>
                                <th>Thể loại</th>
                                <th>Giá Bán & Thuê</th>
                                <th>SL Tồn</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pageItems as AdminBookData[]).map((book) => (
                                <tr key={book.id}>
                                    <td>
                                        <div className={styles.bookCell}>
                                            <img src={book.coverImg} className={styles.bookCover} alt={book.title} />
                                            <div className={styles.cellTitle}>
                                                <strong>{book.title}</strong>
                                                <span>
                                                    {book.author} • ISBN {book.isbn}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{publisherNameMap.get(book.publisherId) || 'Chưa cập nhật'}</td>
                                    <td>
                                        <div className={styles.chipRow}>
                                            {book.categoryIds.map((id) => (
                                                <span className={styles.chip} key={id}>
                                                    {categoryNameMap.get(id)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.cellTitle}>
                                            <span>Sách giấy: {formatCurrency(book.physicalPrice)}</span>
                                            <span>
                                                E-book:{' '}
                                                {book.eBookPrice > 0 ? (
                                                    formatCurrency(book.eBookPrice)
                                                ) : (
                                                    <em style={{ color: '#94a3b8' }}>Không bán Online</em>
                                                )}
                                            </span>
                                            <span>
                                                Thuê (T/T/N):{' '}
                                                {book.eBookPrice > 0 ? (
                                                    `${formatCurrency(book.weeklyRentalPrice)} / ${formatCurrency(book.monthlyRentalPrice || 0)} / ${formatCurrency(book.yearlyRentalPrice || 0)}`
                                                ) : (
                                                    <em style={{ color: '#94a3b8' }}>Không cho thuê</em>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{book.stockCount}</strong>
                                    </td>
                                    <td>{renderStatusBadge(book.status)}</td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button type="button" className={styles.btnTable} onClick={() => openEditModal('books', book.id)}>
                                                <Pencil size={14} /> Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.btnTable} ${styles.danger}`}
                                                onClick={() => setConfirmState({ kind: 'books', id: book.id, title: book.title })}
                                            >
                                                <Trash2 size={14} /> Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 2. BẢNG DỮ LIỆU DANH MỤC THỂ LOẠI */}
                {activeTab === 'categories' && (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Mã danh mục</th>
                                <th>Tên thể loại</th>
                                <th>Danh mục cha</th>
                                <th>Mô tả</th>
                                <th>Số lượng sách</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pageItems as CategoryData[]).map((cat) => (
                                <tr key={cat.id}>
                                    <td><strong>CAT-{cat.id}</strong></td>
                                    <td><strong>{cat.name}</strong></td>
                                    <td>{cat.parentId ? categoryNameMap.get(cat.parentId) || 'Gốc' : 'Danh mục gốc'}</td>
                                    <td>{cat.description || 'Không có mô tả'}</td>
                                    <td><span className={styles.badgeCount}>{cat.bookCount} đầu sách</span></td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button type="button" className={styles.btnTable} onClick={() => openEditModal('categories', cat.id)}>
                                                <Pencil size={14} /> Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.btnTable} ${styles.danger}`}
                                                onClick={() => setConfirmState({ kind: 'categories', id: cat.id, title: cat.name })}
                                            >
                                                <Trash2 size={14} /> Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 3. BẢNG DỮ LIỆU NHÀ XUẤT BẢN */}
                {activeTab === 'publishers' && (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Mã NXB</th>
                                <th>Tên Nhà Xuất Bản</th>
                                <th>Địa chỉ</th>
                                <th>Thông tin liên hệ</th>
                                <th>Số lượng sách</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pageItems as PublisherData[]).map((pub) => (
                                <tr key={pub.id}>
                                    <td><strong>PUB-{pub.id}</strong></td>
                                    <td><strong>{pub.name}</strong></td>
                                    <td>{pub.address || 'Chưa cập nhật'}</td>
                                    <td>
                                        <div className={styles.cellTitle}>
                                            <span>SĐT: {pub.phone || 'Chưa có'}</span>
                                            <span>Email: {pub.email || 'Chưa có'}</span>
                                        </div>
                                    </td>
                                    <td><span className={styles.badgeCount}>{pub.bookCount} đầu sách</span></td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button type="button" className={styles.btnTable} onClick={() => openEditModal('publishers', pub.id)}>
                                                <Pencil size={14} /> Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.btnTable} ${styles.danger}`}
                                                onClick={() => setConfirmState({ kind: 'publishers', id: pub.id, title: pub.name })}
                                            >
                                                <Trash2 size={14} /> Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* THANH PHÂN TRANG */}
                <div className={styles.paginationBar}>
                    <span>
                        {filteredItems.length === 0
                            ? 'Không có dữ liệu'
                            : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredItems.length
                            )} trên tổng số ${filteredItems.length} bản ghi`}
                    </span>

                    <div className={styles.pageBtns}>
                        <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={currentPage === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`${styles.pageBtn} ${p === currentPage ? styles.activePage : ''}`}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* MODAL THÊM / SỬA SÁCH, THỂ LOẠI & NXB */}
            {modalKind && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingId
                                        ? `Cập nhật ${modalKind === 'books' ? 'sách' : modalKind === 'categories' ? 'danh mục' : 'NXB'}`
                                        : `Thêm ${modalKind === 'books' ? 'sách mới' : modalKind === 'categories' ? 'danh mục mới' : 'NXB mới'}`}
                                </h3>
                                <p>Dữ liệu thay đổi sẽ được ghi nhận vào Audit Log khi kết nối backend.</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {modalKind === 'books' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="title">Tên sách *</label>
                                        <input
                                            id="title"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.title as string) || ''}
                                            onChange={(e) => updateDraft('title', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="author">Tác giả *</label>
                                        <input
                                            id="author"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.author as string) || ''}
                                            onChange={(e) => updateDraft('author', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="isbn">Mã ISBN *</label>
                                        <input
                                            id="isbn"
                                            type="text"
                                            className={styles.formControl}
                                            disabled={!!editingId}
                                            value={(draft.isbn as string) || ''}
                                            onChange={(e) => updateDraft('isbn', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="publisherId">Nhà xuất bản *</label>
                                        <select
                                            id="publisherId"
                                            className={styles.formControl}
                                            value={(draft.publisherId as number) || ''}
                                            onChange={(e) => updateDraft('publisherId', Number(e.target.value))}
                                        >
                                            {publishers.map((pub) => (
                                                <option key={pub.id} value={pub.id}>
                                                    {pub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ĐÃ SỬA: Multi-Select Checkbox Thể loại linh hoạt */}
                                    <div className={styles.formGroup} ref={categoryDropdownRef} style={{ position: 'relative' }}>
                                        <label>Thể loại (Chọn nhiều) *</label>
                                        <div
                                            className={styles.dropdownCheckboxTrigger}
                                            onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                        >
                                            <span className={styles.dropdownCheckboxValue}>{selectedCategoriesText}</span>
                                            <ChevronDown size={16} />
                                        </div>

                                        {isCategoryDropdownOpen && (
                                            <div className={styles.dropdownCheckboxMenu}>
                                                {categories.map((cat) => {
                                                    const currentCategoryIds = (draft.categoryIds as number[]) || [];
                                                    const isChecked = currentCategoryIds.includes(cat.id);
                                                    return (
                                                        <label
                                                            key={cat.id}
                                                            className={styles.checkboxOption}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleCategorySelection(cat.id)}
                                                            />
                                                            <span>{cat.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="status">Trạng thái kinh doanh</label>
                                        <select
                                            id="status"
                                            className={styles.formControl}
                                            value={(draft.status as AdminBookStatus) || 'selling'}
                                            onChange={(e) => updateDraft('status', e.target.value as AdminBookStatus)}
                                        >
                                            <option value="selling">Đang bán</option>
                                            <option value="upcoming">Sắp phát hành</option>
                                            <option value="stopped">Ngừng bán</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="physicalPrice">Giá bán sách giấy (VNĐ)</label>
                                        <input
                                            id="physicalPrice"
                                            type="number"
                                            className={styles.formControl}
                                            value={(draft.physicalPrice as number) || 0}
                                            onChange={(e) => updateDraft('physicalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="eBookPrice">Giá bán E-book (VNĐ) - Đặt = 0 nếu không bán Online</label>
                                        <input
                                            id="eBookPrice"
                                            type="number"
                                            className={styles.formControl}
                                            value={(draft.eBookPrice as number) || 0}
                                            onChange={(e) => updateDraft('eBookPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="weeklyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tuần (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="weeklyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.weeklyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('weeklyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="monthlyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tháng (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="monthlyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.monthlyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('monthlyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="yearlyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Năm (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="yearlyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.yearlyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('yearlyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="stockCount" className={styles.lockedLabel}>
                                            Số lượng tồn kho <Lock size={12} />
                                        </label>
                                        <input
                                            id="stockCount"
                                            type="number"
                                            className={`${styles.formControl} ${styles.disabledInput}`}
                                            disabled
                                            value={editingId ? (draft.stockCount as number) : 0}
                                        />
                                        <span className={styles.inputHelpText}>
                                            SL tồn kho chỉ được điều chỉnh khi lập Phiếu Nhập Kho.
                                        </span>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="coverImg">Đường dẫn ảnh bìa chính (URL)</label>
                                        <input
                                            id="coverImg"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.coverImg as string) || ''}
                                            onChange={(e) => updateDraft('coverImg', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {modalKind === 'categories' && (
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="catName">Tên thể loại *</label>
                                        <input
                                            id="catName"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.name as string) || ''}
                                            onChange={(e) => updateDraft('name', e.target.value)}
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="parentId">Danh mục cha</label>
                                        <select
                                            id="parentId"
                                            className={styles.formControl}
                                            value={(draft.parentId as number) || ''}
                                            onChange={(e) => updateDraft('parentId', e.target.value)}
                                        >
                                            <option value="">Danh mục gốc (Không có cha)</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="catDesc">Mô tả thể loại</label>
                                        <textarea
                                            id="catDesc"
                                            rows={3}
                                            className={styles.formControl}
                                            value={(draft.description as string) || ''}
                                            onChange={(e) => updateDraft('description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {modalKind === 'publishers' && (
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="pubName">Tên Nhà Xuất Bản *</label>
                                        <input
                                            id="pubName"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.name as string) || ''}
                                            onChange={(e) => updateDraft('name', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="pubPhone">Số điện thoại</label>
                                        <input
                                            id="pubPhone"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.phone as string) || ''}
                                            onChange={(e) => updateDraft('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="pubEmail">Email liên hệ</label>
                                        <input
                                            id="pubEmail"
                                            type="email"
                                            className={styles.formControl}
                                            value={(draft.email as string) || ''}
                                            onChange={(e) => updateDraft('email', e.target.value)}
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="pubAddress">Địa chỉ trụ sở</label>
                                        <input
                                            id="pubAddress"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.address as string) || ''}
                                            onChange={(e) => updateDraft('address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {formWarn && <div className={styles.formWarn}>{formWarn}</div>}
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                                Hủy
                            </button>
                            <button type="button" className={styles.btnPrimary} onClick={saveModal}>
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN XÓA */}
            {confirmState && (
                <div className={styles.overlay}>
                    <div className={`${styles.modal} ${styles.modalSmall}`}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Xác nhận xóa</h3>
                                <p>{confirmState.title}</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={() => setConfirmState(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            Bạn có chắc chắn muốn xóa dữ liệu này không? Thao tác không thể hoàn tác.
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={() => setConfirmState(null)}>
                                Hủy
                            </button>
                            <button type="button" className={styles.btnDanger} onClick={confirmDelete}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminBookManagement;