import React, { useMemo, useState } from 'react';
import {
    BookOpen,
    Building2,
    ChevronLeft,
    ChevronRight,
    FolderTree,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { AdminBookData, AdminBookStatus } from '../../../types/adminBook';
import type { CategoryData } from '../../../types/category';
import type { PublisherData } from '../../../types/publisher';
import styles from './AdminBookManagement.module.css';

type AdminBookTab = 'books' | 'categories' | 'publishers';
type ModalKind = AdminBookTab | null;

interface ConfirmState {
    kind: AdminBookTab;
    id: string | number;
    title: string;
}

const PAGE_SIZE = 5;

const initialCategories: CategoryData[] = [
    { id: 1, name: 'Văn học', parentId: null, description: 'Nhóm danh mục văn học tổng hợp', bookCount: 5 },
    { id: 2, name: 'Tiểu thuyết', parentId: 1, description: 'Tiểu thuyết trong và ngoài nước', bookCount: 3 },
    { id: 3, name: 'Trinh thám', parentId: 1, description: 'Tác phẩm phá án, bí ẩn', bookCount: 1 },
    { id: 4, name: 'Kinh tế', parentId: null, description: 'Sách kinh tế và quản trị', bookCount: 0 },
];

const initialPublishers: PublisherData[] = [
    { id: 1, name: 'NXB Văn Học', address: '18 Nguyễn Trường Tộ, Hà Nội', phone: '02438221435', email: 'contact@vanhoc.vn', description: 'Đối tác sách văn học', bookCount: 1 },
    { id: 2, name: 'NXB Tri Thức', address: '53 Nguyễn Du, Hà Nội', phone: '02439421219', email: 'info@trithuc.vn', description: 'Đối tác sách tri thức', bookCount: 1 },
    { id: 3, name: 'NXB Trẻ', address: '161B Lý Chính Thắng, TP.HCM', phone: '02839316289', email: 'nxbtre@tre.vn', description: 'Đối tác sách trẻ', bookCount: 1 },
];

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
        eBookPrice: 75000,
        weeklyRentalPrice: 0,
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
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [formWarn, setFormWarn] = useState('');
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const [toast, setToast] = useState('');

    const categoryNameMap = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories]
    );

    const publisherNameMap = useMemo(
        () => new Map(publishers.map((publisher) => [publisher.id, publisher.name])),
        [publishers]
    );

    const stats = useMemo(() => {
        return {
            total: books.length,
            selling: books.filter((book) => book.status === 'selling').length,
            upcoming: books.filter((book) => book.status === 'upcoming').length,
            stopped: books.filter((book) => book.status === 'stopped').length,
        };
    }, [books]);

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
            return categories.filter((category) => {
                const parentName = category.parentId ? categoryNameMap.get(category.parentId) || '' : '';
                return !q || `${category.name} ${parentName} ${category.description || ''}`.toLowerCase().includes(q);
            });
        }

        return publishers.filter((publisher) => {
            return !q || `${publisher.name} ${publisher.address || ''} ${publisher.phone || ''} ${publisher.email || ''}`.toLowerCase().includes(q);
        });
    }, [activeTab, books, categories, categoryNameMap, publishers, publisherNameMap, searchText, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const showToast = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 2600);
    };

    const resetListState = (tab: AdminBookTab) => {
        setActiveTab(tab);
        setSearchText('');
        setStatusFilter('');
        setPage(1);
    };

    const updateDraft = (key: string, value: string) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
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
                publisherId: String(publishers[0]?.id || ''),
                categoryIds: String(categories[0]?.id || ''),
                coverImg: '',
                physicalPrice: '0',
                eBookPrice: '0',
                weeklyRentalPrice: '0',
                stockCount: '0',
                status: 'selling',
            });
        }

        if (activeTab === 'categories') {
            setDraft({ name: '', parentId: '', description: '' });
        }

        if (activeTab === 'publishers') {
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
                publisherId: String(book.publisherId),
                categoryIds: book.categoryIds.join(','),
                coverImg: book.coverImg,
                physicalPrice: String(book.physicalPrice),
                eBookPrice: String(book.eBookPrice),
                weeklyRentalPrice: String(book.weeklyRentalPrice),
                stockCount: String(book.stockCount),
                status: book.status,
            });
        }

        if (kind === 'categories') {
            const category = categories.find((item) => item.id === id);
            if (!category) return;
            setDraft({
                name: category.name,
                parentId: category.parentId ? String(category.parentId) : '',
                description: category.description || '',
            });
        }

        if (kind === 'publishers') {
            const publisher = publishers.find((item) => item.id === id);
            if (!publisher) return;
            setDraft({
                name: publisher.name,
                address: publisher.address || '',
                phone: publisher.phone || '',
                email: publisher.email || '',
                description: publisher.description || '',
            });
        }
    };

    const closeModal = () => {
        setModalKind(null);
        setEditingId(null);
        setFormWarn('');
    };

    const saveModal = () => {
        if (modalKind === 'books') saveBook();
        if (modalKind === 'categories') saveCategory();
        if (modalKind === 'publishers') savePublisher();
    };

    const saveBook = () => {
        if (!draft.title?.trim() || !draft.isbn?.trim() || !draft.publisherId || !draft.categoryIds) {
            setFormWarn('Vui lòng nhập Tên sách, ISBN, NXB và ít nhất một Thể loại.');
            return;
        }

        const duplicatedIsbn = books.some((book) => book.isbn === draft.isbn && book.id !== editingId);
        if (duplicatedIsbn) {
            setFormWarn('Mã ISBN đã tồn tại trong hệ thống.');
            return;
        }

        const nextBook: AdminBookData = {
            id: String(draft.id || `B${Date.now()}`),
            title: draft.title.trim(),
            author: draft.author?.trim() || 'Chưa cập nhật',
            isbn: draft.isbn.trim(),
            publisherId: Number(draft.publisherId),
            categoryIds: draft.categoryIds.split(',').map((id) => Number(id)).filter(Boolean),
            coverImg: draft.coverImg?.trim() || 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
            physicalPrice: Number(draft.physicalPrice || 0),
            eBookPrice: Number(draft.eBookPrice || 0),
            weeklyRentalPrice: Number(draft.weeklyRentalPrice || 0),
            stockCount: Number(draft.stockCount || 0),
            status: draft.status as AdminBookStatus,
            orderCount: books.find((book) => book.id === editingId)?.orderCount || 0,
        };

        if (nextBook.physicalPrice < 0 || nextBook.eBookPrice < 0 || nextBook.stockCount < 0) {
            setFormWarn('Giá bán và số lượng tồn không được nhập giá trị âm.');
            return;
        }

        setBooks((prev) => editingId ? prev.map((book) => book.id === editingId ? nextBook : book) : [nextBook, ...prev]);
        closeModal();
        showToast(editingId ? 'Cập nhật thông tin Sách thành công.' : 'Thêm sách mới thành công.');
    };

    const saveCategory = () => {
        const name = draft.name?.trim();
        if (!name) {
            setFormWarn('Tên danh mục không được để trống.');
            return;
        }

        const duplicatedName = categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingId);
        if (duplicatedName) {
            setFormWarn('Tên danh mục này đã tồn tại trong hệ thống.');
            return;
        }

        const nextCategory: CategoryData = {
            id: typeof editingId === 'number' ? editingId : Math.max(0, ...categories.map((item) => item.id)) + 1,
            name,
            parentId: draft.parentId ? Number(draft.parentId) : null,
            description: draft.description || null,
            bookCount: categories.find((category) => category.id === editingId)?.bookCount || 0,
        };

        setCategories((prev) => editingId ? prev.map((category) => category.id === editingId ? nextCategory : category) : [nextCategory, ...prev]);
        closeModal();
        showToast(editingId ? 'Cập nhật danh mục thành công.' : 'Thêm danh mục thể loại thành công.');
    };

    const savePublisher = () => {
        const name = draft.name?.trim();
        if (!name) {
            setFormWarn('Tên NXB không được để trống.');
            return;
        }

        const duplicatedName = publishers.some((publisher) => publisher.name.toLowerCase() === name.toLowerCase() && publisher.id !== editingId);
        if (duplicatedName) {
            setFormWarn('Tên Nhà xuất bản này đã tồn tại trong hệ thống.');
            return;
        }

        const nextPublisher: PublisherData = {
            id: typeof editingId === 'number' ? editingId : Math.max(0, ...publishers.map((item) => item.id)) + 1,
            name,
            address: draft.address || null,
            phone: draft.phone || null,
            email: draft.email || null,
            description: draft.description || null,
            bookCount: publishers.find((publisher) => publisher.id === editingId)?.bookCount || 0,
        };

        setPublishers((prev) => editingId ? prev.map((publisher) => publisher.id === editingId ? nextPublisher : publisher) : [nextPublisher, ...prev]);
        closeModal();
        showToast(editingId ? 'Cập nhật NXB thành công.' : 'Thêm nhà xuất bản thành công.');
    };

    const requestDelete = (kind: AdminBookTab, id: string | number, title: string) => {
        setConfirmState({ kind, id, title });
    };

    const confirmDelete = () => {
        if (!confirmState) return;

        if (confirmState.kind === 'books') {
            const book = books.find((item) => item.id === confirmState.id);
            if (book?.orderCount) {
                setBooks((prev) => prev.map((item) => item.id === confirmState.id ? { ...item, status: 'stopped' } : item));
                showToast('Sách đã có dữ liệu đơn hàng nên hệ thống chuyển sang Ngừng bán.');
            } else {
                setBooks((prev) => prev.filter((item) => item.id !== confirmState.id));
                showToast('Xóa Sách thành công.');
            }
        }

        if (confirmState.kind === 'categories') {
            const category = categories.find((item) => item.id === confirmState.id);
            if (category?.bookCount) {
                showToast(`Không thể xóa danh mục vì đang có ${category.bookCount} sản phẩm liên kết.`);
            } else {
                setCategories((prev) => prev.filter((item) => item.id !== confirmState.id));
                showToast('Xóa danh mục thành công.');
            }
        }

        if (confirmState.kind === 'publishers') {
            const publisher = publishers.find((item) => item.id === confirmState.id);
            if (publisher?.bookCount) {
                showToast('Không thể xóa Nhà xuất bản này vì đang có sản phẩm sách liên kết.');
            } else {
                setPublishers((prev) => prev.filter((item) => item.id !== confirmState.id));
                showToast('Xóa NXB thành công.');
            }
        }

        setConfirmState(null);
    };

    const renderStatusBadge = (status: AdminBookStatus) => {
        const className = status === 'selling' ? styles.statusSelling : status === 'upcoming' ? styles.statusUpcoming : styles.statusStopped;
        return <span className={`${styles.statusBadge} ${className}`}>{statusLabels[status]}</span>;
    };

    const renderBooksTable = () => (
        <table className={styles.dataTable}>
            <thead>
                <tr>
                    <th>Đầu sách</th>
                    <th>NXB</th>
                    <th>Thể loại</th>
                    <th>Giá bán / thuê</th>
                    <th>SL tồn</th>
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
                                    <span>{book.author} • ISBN {book.isbn}</span>
                                </div>
                            </div>
                        </td>
                        <td>{publisherNameMap.get(book.publisherId) || 'Chưa cập nhật'}</td>
                        <td>
                            <div className={styles.chipRow}>
                                {book.categoryIds.map((id) => <span className={styles.chip} key={id}>{categoryNameMap.get(id)}</span>)}
                            </div>
                        </td>
                        <td>
                            <div className={styles.cellTitle}>
                                <span>Sách giấy: {formatCurrency(book.physicalPrice)}</span>
                                <span>E-book: {formatCurrency(book.eBookPrice)}</span>
                                <span>Thuê tuần: {formatCurrency(book.weeklyRentalPrice)}</span>
                            </div>
                        </td>
                        <td>{book.stockCount}</td>
                        <td>{renderStatusBadge(book.status)}</td>
                        <td>{renderActionButtons('books', book.id, book.title)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderCategoriesTable = () => (
        <table className={styles.dataTable}>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>ParentId</th>
                    <th>Description</th>
                    <th>Số sách</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {(pageItems as CategoryData[]).map((category) => (
                    <tr key={category.id}>
                        <td>{category.id}</td>
                        <td>{category.name}</td>
                        <td>{category.parentId ? `${category.parentId} - ${categoryNameMap.get(category.parentId)}` : 'NULL'}</td>
                        <td>{category.description || 'NULL'}</td>
                        <td>{category.bookCount || 0}</td>
                        <td>{renderActionButtons('categories', category.id, category.name)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderPublishersTable = () => (
        <table className={styles.dataTable}>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Số sách</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {(pageItems as PublisherData[]).map((publisher) => (
                    <tr key={publisher.id}>
                        <td>{publisher.id}</td>
                        <td>{publisher.name}</td>
                        <td>{publisher.address || 'NULL'}</td>
                        <td>{publisher.phone || 'NULL'}</td>
                        <td>{publisher.email || 'NULL'}</td>
                        <td>{publisher.bookCount || 0}</td>
                        <td>{renderActionButtons('publishers', publisher.id, publisher.name)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderActionButtons = (kind: AdminBookTab, id: string | number, title: string) => (
        <div className={styles.actionBtns}>
            <button type="button" className={styles.btnTable} onClick={() => openEditModal(kind, id)}>
                <Pencil /> Sửa
            </button>
            <button type="button" className={`${styles.btnTable} ${styles.danger}`} onClick={() => requestDelete(kind, id, title)}>
                <Trash2 /> Xóa
            </button>
        </div>
    );

    const renderTableContent = () => {
        if (pageItems.length === 0) {
            return <div className={styles.emptyState}>Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.</div>;
        }

        if (activeTab === 'books') return renderBooksTable();
        if (activeTab === 'categories') return renderCategoriesTable();
        return renderPublishersTable();
    };

    const renderModalBody = () => {
        if (modalKind === 'books') {
            return (
                <div className={styles.formGrid}>
                    {renderInput('title', 'Tên sách *')}
                    {renderInput('author', 'Tác giả')}
                    {renderInput('isbn', 'Mã ISBN *')}
                    <div className={styles.formGroup}>
                        <label htmlFor="bookPublisher">Nhà xuất bản *</label>
                        <select id="bookPublisher" className={styles.formControl} value={draft.publisherId || ''} onChange={(event) => updateDraft('publisherId', event.target.value)}>
                            {publishers.map((publisher) => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="bookCategories">Thể loại *</label>
                        <select id="bookCategories" className={styles.formControl} value={draft.categoryIds || ''} onChange={(event) => updateDraft('categoryIds', event.target.value)}>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="bookStatus">Trạng thái</label>
                        <select id="bookStatus" className={styles.formControl} value={draft.status || 'selling'} onChange={(event) => updateDraft('status', event.target.value)}>
                            <option value="selling">Đang bán</option>
                            <option value="upcoming">Sắp phát hành</option>
                            <option value="stopped">Ngừng bán</option>
                        </select>
                    </div>
                    {renderInput('physicalPrice', 'Giá bán vật lý', 'number')}
                    {renderInput('eBookPrice', 'Giá E-book', 'number')}
                    {renderInput('weeklyRentalPrice', 'Giá thuê theo tuần', 'number')}
                    {renderInput('stockCount', 'Số lượng tồn', 'number')}
                    <div className={`${styles.formGroup} ${styles.full}`}>
                        <label htmlFor="coverImg">Ảnh bìa chính</label>
                        <input id="coverImg" className={styles.formControl} value={draft.coverImg || ''} onChange={(event) => updateDraft('coverImg', event.target.value)} />
                    </div>
                </div>
            );
        }

        if (modalKind === 'categories') {
            return (
                <div className={styles.formGrid}>
                    {renderInput('name', 'Tên danh mục *')}
                    <div className={styles.formGroup}>
                        <label htmlFor="categoryParent">Danh mục cha</label>
                        <select id="categoryParent" className={styles.formControl} value={draft.parentId || ''} onChange={(event) => updateDraft('parentId', event.target.value)}>
                            <option value="">NULL</option>
                            {categories.filter((item) => item.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </div>
                    {renderTextarea('description', 'Mô tả')}
                </div>
            );
        }

        return (
            <div className={styles.formGrid}>
                {renderInput('name', 'Tên NXB *')}
                {renderInput('phone', 'Số điện thoại')}
                {renderInput('email', 'Email', 'email')}
                {renderInput('address', 'Địa chỉ')}
                {renderTextarea('description', 'Mô tả')}
            </div>
        );
    };

    const renderInput = (key: string, label: string, type = 'text') => (
        <div className={styles.formGroup}>
            <label htmlFor={key}>{label}</label>
            <input id={key} type={type} className={styles.formControl} value={draft[key] || ''} onChange={(event) => updateDraft(key, event.target.value)} />
        </div>
    );

    const renderTextarea = (key: string, label: string) => (
        <div className={`${styles.formGroup} ${styles.full}`}>
            <label htmlFor={key}>{label}</label>
            <textarea id={key} className={styles.formControl} value={draft[key] || ''} onChange={(event) => updateDraft(key, event.target.value)} />
        </div>
    );

    const tabActionLabel = activeTab === 'books' ? 'Thêm sách mới' : activeTab === 'categories' ? 'Thêm danh mục mới' : 'Thêm NXB mới';

    return (
        <>
            <section className={styles.statsGrid}>
                <div className={styles.statBox}><span className={styles.statLabel}>Tổng số sách</span><span className={styles.statValue}>{stats.total}</span></div>
                <div className={styles.statBox}><span className={styles.statLabel}>Đang kinh doanh</span><span className={styles.statValue}>{stats.selling}</span></div>
                <div className={styles.statBox}><span className={styles.statLabel}>Sắp phát hành</span><span className={styles.statValue}>{stats.upcoming}</span></div>
                <div className={styles.statBox}><span className={styles.statLabel}>Ngừng bán</span><span className={styles.statValue}>{stats.stopped}</span></div>
            </section>

            <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.tabRow}>
                        <button type="button" className={`${styles.tabButton} ${activeTab === 'books' ? styles.active : ''}`} onClick={() => resetListState('books')}>
                            <BookOpen /> Quản lý đầu sách
                        </button>
                        <button type="button" className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`} onClick={() => resetListState('categories')}>
                            <FolderTree /> Quản lý danh mục thể loại
                        </button>
                        <button type="button" className={`${styles.tabButton} ${activeTab === 'publishers' ? styles.active : ''}`} onClick={() => resetListState('publishers')}>
                            <Building2 /> Quản lý NXB
                        </button>
                    </div>

                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <Search />
                            <input
                                type="text"
                                className={styles.searchInput}
                                value={searchText}
                                onChange={(event) => {
                                    setSearchText(event.target.value);
                                    setPage(1);
                                }}
                                placeholder={activeTab === 'books' ? 'Tìm theo tên sách, tác giả, ISBN...' : 'Tìm theo tên hoặc thông tin liên quan...'}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            {activeTab === 'books' && (
                                <select className={styles.filterSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="selling">Đang bán</option>
                                    <option value="upcoming">Sắp phát hành</option>
                                    <option value="stopped">Ngừng bán</option>
                                </select>
                            )}
                            <button type="button" className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus /> {tabActionLabel}
                            </button>
                        </div>
                    </div>
                </div>

                {renderTableContent()}

                <div className={styles.paginationBar}>
                    <span>
                        {filteredItems.length === 0
                            ? 'Không có dữ liệu'
                            : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, filteredItems.length)} trên tổng số ${filteredItems.length} bản ghi`}
                    </span>
                    <div className={styles.pageBtns}>
                        <button type="button" className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                            <ChevronLeft />
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                            <button type="button" key={item} className={`${styles.pageBtn} ${item === currentPage ? styles.active : ''}`} onClick={() => setPage(item)}>
                                {item}
                            </button>
                        ))}
                        <button type="button" className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                            <ChevronRight />
                        </button>
                    </div>
                </div>
            </section>

            {modalKind && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>{editingId ? 'Cập nhật thông tin' : tabActionLabel}</h3>
                                <p>Dữ liệu thay đổi sẽ được ghi nhận vào Audit Log khi kết nối backend.</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Đóng">
                                <X />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {renderModalBody()}
                            {formWarn && <div className={styles.formWarn}>{formWarn}</div>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={closeModal}>Hủy</button>
                            <button type="button" className={styles.btnPrimary} onClick={saveModal}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmState && (
                <div className={styles.overlay}>
                    <div className={`${styles.modal} ${styles.modalSmall}`}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Xác nhận xóa</h3>
                                <p>{confirmState.title}</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={() => setConfirmState(null)} aria-label="Đóng">
                                <X />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            Thao tác xóa sẽ kiểm tra ràng buộc dữ liệu liên kết trước khi thực hiện.
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={() => setConfirmState(null)}>Hủy</button>
                            <button type="button" className={styles.btnDanger} onClick={confirmDelete}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
};

export default AdminBookManagement;
