import TopBar from '../components/layout/TopBar';
import { Search, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import BookPagination from '../components/common/BookPagination';
import OrderHistoryCard from '../components/features/order-history/OrderHistoryCard';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { orderPeriods, orderSorts, orderTabs, orderTypes } from '../utils/orderHistory';
import styles from './OrderHistoryPage.module.css';

export const OrderHistoryPage = () => {
    const history = useOrderHistory();
    return <div className={styles.page}>
        <TopBar /><Header /><Navbar />
        <main className={styles.container}>
            <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Lịch sử đơn hàng' }]} />
            <div className={styles.pageWrap}>
                <h1 className={styles.pageTitle}>Đơn hàng của tôi</h1>
                <div className={styles.tabsContainer}>
                    <div className={styles.tabHeaders} role="tablist" aria-label="Trạng thái đơn hàng">
                        {orderTabs.map(tab => <button type="button" role="tab" aria-selected={history.tab === tab.id} key={tab.id} className={`${styles.tabBtn} ${history.tab === tab.id ? styles.tabBtnActive : ''}`} onClick={() => history.setTab(tab.id)}>{tab.label}</button>)}
                    </div>
                    <section className={styles.filters} aria-label="Tìm kiếm và lọc đơn hàng">
                        <form key={history.bookTitle} className={styles.searchForm} onSubmit={event => { event.preventDefault(); history.setSearch(String(new FormData(event.currentTarget).get('bookTitle') ?? '')); }}>
                            <Search size={18} aria-hidden="true" /><input name="bookTitle" aria-label="Tên sách" placeholder="Tìm theo tên sách trong đơn hàng..." defaultValue={history.bookTitle} maxLength={200} /><button type="submit">Tìm kiếm</button>
                        </form>
                        <div className={styles.filterGrid}>
                            <label>Thời gian đặt đơn<select value={history.period} onChange={event => history.setPeriod(event.target.value)}>{orderPeriods.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                            <label>Loại đơn<select value={history.orderType} onChange={event => history.setType(event.target.value)}>{orderTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                            <label>Sắp xếp<select value={history.sortBy} onChange={event => history.setSort(event.target.value)}>{orderSorts.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                        </div>
                        {history.period === 'custom' && <div className={styles.dateGrid}><label>Từ ngày<input type="date" value={history.from} max={history.to || undefined} onChange={event => history.setDates(event.target.value, history.to)} /></label><label>Đến ngày<input type="date" value={history.to} min={history.from || undefined} onChange={event => history.setDates(history.from, event.target.value)} /></label></div>}
                        {history.activeFilters.length > 0 && <div className={styles.activeFilters}><span>Đang lọc:</span>{history.activeFilters.map(filter => <button type="button" className={styles.filterChip} key={filter.key} onClick={() => history.removeFilter(filter.key)} aria-label={`Bỏ lọc ${filter.label}`}>{filter.label}<X size={12} /></button>)}<button type="button" className={styles.clearFilters} onClick={history.clearFilters}>Xóa bộ lọc</button></div>}
                    </section>
                    {!history.loading && !history.error && <p className={styles.resultCount} role="status"><strong>{history.total} đơn hàng</strong> {history.activeFilters.length ? 'phù hợp ' : ''}trong mục {orderTabs.find(tab => tab.id === history.tab)!.label}</p>}
                    {/* Danh sách đơn hàng */}
                    <div className={styles.orderList}>
                        {history.loading ? <div className={styles.emptyState} role="status">Đang tải dữ liệu...</div> : history.error ? <div className={styles.emptyState} role="alert">{history.error}</div> : history.pageOrders.length === 0 ? <div className={styles.emptyState}>{history.activeFilters.length ? 'Không tìm thấy đơn hàng phù hợp với điều kiện đã chọn.' : 'Chưa có đơn hàng nào trong trạng thái này.'}</div> : history.pageOrders.map(order => <OrderHistoryCard key={order.id} order={order} returnPath={history.returnPath} />)}
                    </div>
                    {!history.loading && !history.error && history.total > 0 && <BookPagination page={history.page} pageSize={history.pageSize} totalCount={history.total} pageSizes={[5, 10, 20]} itemLabel="đơn hàng" onPageChange={history.setPage} onPageSizeChange={history.setPageSize} />}
                </div>
            </div>
        </main>
    </div>;
};

export default OrderHistoryPage;
