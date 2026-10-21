import React from 'react';
import { useBookManagement } from '../../../hooks/useBookManagement';
import { useEbookConfiguration } from '../../../hooks/useEbookConfiguration';
import {
    BookOpen,
    Building2,
    FolderTree,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { AdminBookData, AdminBookStatus } from '../../../types/book';
import type { CategoryData } from '../../../types/category';
import type { PublisherData } from '../../../types/publisher';
import BookPagination from '../../common/BookPagination';
import BookCover from '../../common/BookCover';
import ToastNotification from '../../common/ToastNotification';
import styles from './AdminBookManagement.module.css';
import AdminCatalogForm from './AdminCatalogForm';
import EBookCOnfigurationField from './EBookCOnfigurationField';

const statusLabels: Record<AdminBookStatus, string> = {
    selling: 'Đang bán',
    upcoming: 'Sắp phát hành',
    stopped: 'Ngừng bán',
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const AdminBookManagement: React.FC = () => {
    const controller = useBookManagement();
    const ebookController = useEbookConfiguration();
    const { categories, publishers, isLoading, error, activeTab, searchText, statusFilter, categoryFilter, publisherFilter, minPrice, maxPrice, pageSize, confirmState, toasts, categoryNameMap, publisherNameMap, stats, currentPage, pageItems, filteredItems, setSearchText, setStatusFilter, setCategoryFilter, setPublisherFilter, setMinPrice, setMaxPrice, setPage, setPageSize, setConfirmState, resetListState, openCreateModal, openEditModal, confirmDelete, removeToast } = controller;

    return (
        <>
            <ToastNotification toasts={toasts} onClose={removeToast} />

            {isLoading && <section className={styles.tablePanel}>Đang tải dữ liệu quản lý sách...</section>}
            {error && <section className={styles.tablePanel}>{error}</section>}

            {/* Thống kê KPI */}
            <section className={styles.statsGrid}>
                <button type="button" className={styles.statBox} onClick={() => { resetListState('books'); }}>
                    <span className={styles.statLabel}>TỔNG SỐ SÁCH</span>
                    <span className={styles.statValue}>{stats.total}</span>
                </button>
                <button type="button" className={styles.statBox} onClick={() => { resetListState('books'); setStatusFilter('selling'); }}>
                    <span className={styles.statLabel}>ĐANG KINH DOANH</span>
                    <span className={styles.statValue}>{stats.selling}</span>
                </button>
                <button type="button" className={styles.statBox} onClick={() => { resetListState('books'); setStatusFilter('upcoming'); }}>
                    <span className={styles.statLabel}>SẮP PHÁT HÀNH</span>
                    <span className={styles.statValue}>{stats.upcoming}</span>
                </button>
                <button type="button" className={styles.statBox} onClick={() => { resetListState('books'); setStatusFilter('stopped'); }}>
                    <span className={styles.statLabel}>NGỪNG BÁN</span>
                    <span className={styles.statValue}>{stats.stopped}</span>
                </button>
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
                            {activeTab === 'books' && <>
                                <select aria-label="Lọc thể loại" className={styles.filterSelect} value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(1); }}><option value="">Tất cả thể loại</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                                <select aria-label="Lọc NXB" className={styles.filterSelect} value={publisherFilter} onChange={event => { setPublisherFilter(event.target.value); setPage(1); }}><option value="">Tất cả NXB</option>{publishers.map(publisher => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}</select>
                                <input aria-label="Giá từ" placeholder="Giá từ" type="number" min="0" className={styles.priceFilter} value={minPrice} onChange={event => { setMinPrice(event.target.value); setPage(1); }} />
                                <input aria-label="Giá đến" placeholder="Giá đến" type="number" min="0" className={styles.priceFilter} value={maxPrice} onChange={event => { setMaxPrice(event.target.value); setPage(1); }} />
                            </>}
                            {activeTab === 'books' && (
                                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
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
                    <div className={styles.tableScroll}><table className={styles.dataTable}>
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
                                            <BookCover src={book.coverImg} className={styles.bookCover} title={book.title} />
                                            <div className={styles.cellTitle}>
                                                <strong>{book.title}</strong>
                                                <span>
                                                    {book.author} • ISBN {book.isbn}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{(book.publisherId === null ? book.publisher : publisherNameMap.get(book.publisherId)) || 'Chưa cập nhật'}</td>
                                    <td>
                                        <div className={styles.chipRow}>
                                            {book.categoryIds.map((id) => (
                                                <span className={styles.chip} key={id}>
                                                    {categoryNameMap.get(id)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.priceCell}>
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
                                    <td><span className={`${styles.statusBadge} ${book.status === 'selling' ? styles.statusSelling : book.status === 'upcoming' ? styles.statusUpcoming : styles.statusStopped}`}>{statusLabels[book.status]}</span></td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button type="button" className={`${styles.btnTable} ${styles.ebook}`} onClick={() => ebookController.open(book)}>
                                                <BookOpen size={14} /> EBook
                                            </button>
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
                    </table></div>
                )}

                {/* 2. BẢNG DỮ LIỆU DANH MỤC THỂ LOẠI */}
                {activeTab === 'categories' && (
                    <div className={styles.tableScroll}><table className={styles.dataTable}>
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
                    </table></div>
                )}

                {/* 3. BẢNG DỮ LIỆU NHÀ XUẤT BẢN */}
                {activeTab === 'publishers' && (
                    <div className={styles.tableScroll}><table className={styles.dataTable}>
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
                    </table></div>
                )}

                {/* THANH PHÂN TRANG */}
                <BookPagination
                    variant="admin"
                    page={currentPage}
                    pageSize={pageSize}
                    totalCount={filteredItems.length}
                    pageSizes={[5, 10, 20, 50, 100]}
                    itemLabel={activeTab === 'books' ? 'sách' : 'dòng'}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
            </section>

            <AdminCatalogForm controller={controller} />
            {ebookController.book && <EBookCOnfigurationField controller={ebookController} />}

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
