import { Banknote, BadgeCheck, BookOpen, Clock3 } from 'lucide-react';
import type { DashboardReport } from '../../../types/report';
import { reportMoney } from '../../../utils/reportPresentation';
import styles from './AdminReports.module.css';

export default function ReportSummary({ report }: { report: DashboardReport }) {
    const stats = [
        { title: 'Doanh thu thuần', value: reportMoney(report.totalRevenue), icon: Banknote, detail: 'Sau giảm giá, trong bộ lọc', tone: styles.money },
        { title: 'Đơn hoàn thành', value: report.completedOrders.toLocaleString('vi-VN'), icon: BadgeCheck, detail: 'Đã thanh toán', tone: styles.orders },
        { title: 'Sách giấy đã bán', value: report.physicalQuantity.toLocaleString('vi-VN'), icon: BookOpen, detail: reportMoney(report.physicalRevenue), tone: styles.paper },
        { title: 'Lượt thuê đọc', value: report.rentalQuantity.toLocaleString('vi-VN'), icon: Clock3, detail: reportMoney(report.rentalRevenue), tone: styles.rental },
    ];
    return <section className={styles.summary} aria-label="Chỉ số thống kê">{stats.map(({ title, value, icon: Icon, detail, tone }) => <article key={title} className={styles.metric}>
        <div className={styles.metricTitle}><span>{title}</span><Icon size={18} className={tone} /></div><strong className={styles.metricValue}>{value}</strong><span className={styles.muted}>{detail}</span>
    </article>)}</section>;
}
