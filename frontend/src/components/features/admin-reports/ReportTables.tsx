import { AlertTriangle, Trophy } from 'lucide-react';
import type { DashboardReport } from '../../../types/report';
import { reportMoney } from '../../../utils/reportPresentation';
import BookCover from '../../common/BookCover';
import BookPagination from '../../common/BookPagination';
import StockAvailabilityBadge from '../../common/StockAvailabilityBadge';
import styles from './AdminReports.module.css';

export default function ReportTables({ report, onPageChange }: { report: DashboardReport; onPageChange: (kind: 'top' | 'inventory', page: number, pageSize?: number) => void }) {
    const top = report.topBooksPage, inventory = report.lowStockBooksPage;
    return <div className={styles.tables}>
        <section className={styles.panel}>
            <header className={styles.panelHeader}><h2><Trophy size={17} />Top 10 sách giao dịch</h2><span className={styles.muted}>{top.totalCount} đầu sách</span></header>
            <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Sách</th><th>Giấy</th><th>Thuê</th><th>Doanh thu</th></tr></thead><tbody>
                {top.items.map(book => <tr key={book.bookId}><td><div className={styles.bookCell}><BookCover src={book.coverImg ?? ''} title={book.title} className={styles.cover} /><strong>{book.title}</strong></div></td><td>{book.soldQuantity}</td><td>{book.rentalQuantity}</td><td className={styles.numeric}>{reportMoney(book.totalAmount)}</td></tr>)}
                {top.items.length === 0 && <tr><td colSpan={4} className={styles.emptyCell}>Chưa có giao dịch hợp lệ trong bộ lọc.</td></tr>}
            </tbody></table></div>
            <BookPagination variant="admin" page={top.pageNumber} pageSize={top.pageSize} totalCount={top.totalCount} pageSizes={[5, 10]} itemLabel="đầu sách" onPageChange={page => onPageChange('top', page)} onPageSizeChange={size => onPageChange('top', 1, size)} />
        </section>
        <section className={styles.panel}>
            <header className={styles.panelHeader}><h2><AlertTriangle size={17} />Tồn kho sách giấy hiện tại</h2><span className={styles.threshold}>Ngưỡng ≤ {report.lowStockThreshold}</span></header>
            <div className={styles.inventoryMeta}>{report.totalBooks} đầu sách · {report.totalSellingBooks} đang bán · {report.totalLowStockBooks} cần theo dõi</div>
            <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Sách</th><th>Tồn</th><th>Cảnh báo</th></tr></thead><tbody>
                {inventory.items.map(book => <tr key={book.bookId}><td><div className={styles.bookCell}><BookCover src={book.coverImg ?? ''} title={book.title} className={styles.cover} /><div><strong>{book.title}</strong><small>{book.isbn}</small></div></div></td><td>{book.stockCount}</td><td><StockAvailabilityBadge book={{ isPhysicalAvailable: true, stockCount: book.stockCount, stockStatus: book.stockCount > 0 ? 'low_stock' : 'out_of_stock' }} /></td></tr>)}
                {inventory.items.length === 0 && <tr><td colSpan={3} className={styles.emptyCell}>Không có sách giấy ở mức cảnh báo.</td></tr>}
            </tbody></table></div>
            <BookPagination variant="admin" page={inventory.pageNumber} pageSize={inventory.pageSize} totalCount={inventory.totalCount} pageSizes={[5, 10, 20]} itemLabel="đầu sách" onPageChange={page => onPageChange('inventory', page)} onPageSizeChange={size => onPageChange('inventory', 1, size)} />
        </section>
    </div>;
}
