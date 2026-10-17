import { Download, RefreshCw } from 'lucide-react';
import type { ReportPeriod, ReportQuery } from '../../../types/report';
import type { CategoryData } from '../../../types/category';
import type { PublisherData } from '../../../types/publisher';
import styles from './AdminReports.module.css';

export default function ReportFilters({ query, period, categories, publishers, onChange, onPeriodChange, onRefresh, onExport, canExport }: {
    query: ReportQuery; period: ReportPeriod; categories: CategoryData[]; publishers: PublisherData[];
    onChange: (values: Partial<ReportQuery>) => void; onPeriodChange: (period: ReportPeriod) => void;
    onRefresh: () => void; onExport: () => void; canExport: boolean;
}) {
    return <section className={styles.filters} aria-label="Bộ lọc báo cáo">
        <div className={styles.filterRow}>
            <label>Thời gian<select value={period} onChange={event => onPeriodChange(event.target.value as ReportPeriod)}><option value="month">Tháng này</option><option value="today">Hôm nay</option><option value="last7">7 ngày qua</option><option value="quarter">Quý này</option><option value="custom">Tùy chọn</option></select></label>
            <label>Từ ngày đặt đơn<input type="date" value={query.fromDate} max={query.toDate} disabled={period !== 'custom'} onChange={event => onChange({ fromDate: event.target.value })} /></label>
            <label>Đến ngày đặt đơn<input type="date" value={query.toDate} min={query.fromDate} disabled={period !== 'custom'} onChange={event => onChange({ toDate: event.target.value })} /></label>
            <div className={styles.commands}><button type="button" title="Làm mới báo cáo" aria-label="Làm mới báo cáo" className={styles.iconButton} onClick={onRefresh}><RefreshCw size={17} /></button><button type="button" className={styles.primary} disabled={!canExport} onClick={onExport}><Download size={16} />Xuất PDF</button></div>
        </div>
        <div className={styles.filterRow}>
            <label>Thể loại<select value={query.categoryId ?? ''} onChange={event => onChange({ categoryId: Number(event.target.value) || undefined })}><option value="">Tất cả thể loại</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Nhà xuất bản<select value={query.publisherId ?? ''} onChange={event => onChange({ publisherId: Number(event.target.value) || undefined })}><option value="">Tất cả NXB</option>{publishers.map(publisher => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}</select></label>
            <label>Hình thức<select value={query.purchaseType} onChange={event => onChange({ purchaseType: event.target.value as ReportQuery['purchaseType'] })}><option value="all">Tất cả hình thức</option><option value="physical">Mua sách giấy</option><option value="rental">Thuê đọc</option></select></label>
        </div>
    </section>;
}
