import type { CSSProperties } from 'react';
import { BarChart3 } from 'lucide-react';
import type { RevenuePeriod } from '../../../types/report';
import { reportMoney, revenueChartPoints } from '../../../utils/reportPresentation';
import styles from './AdminReports.module.css';

export default function RevenueChart({ periods, mode, onModeChange }: { periods: RevenuePeriod[]; mode: 'revenue' | 'orders'; onModeChange: (mode: 'revenue' | 'orders') => void }) {
    const points = revenueChartPoints(periods);
    const maximum = Math.max(1, ...points.map(point => mode === 'orders' ? point.completedOrders : Math.max(point.physicalRevenue, point.rentalRevenue)));
    const hasData = points.some(point => point.completedOrders > 0);
    return <section className={styles.panel}>
        <header className={styles.panelHeader}><h2>Diễn biến trong kỳ</h2><div className={styles.segmented}><button type="button" aria-pressed={mode === 'revenue'} onClick={() => onModeChange('revenue')}>Doanh thu</button><button type="button" aria-pressed={mode === 'orders'} onClick={() => onModeChange('orders')}>Số đơn</button></div></header>
        {mode === 'revenue' && <div className={styles.legend}><span><i className={styles.paperSwatch} />Sách giấy</span><span><i className={styles.rentalSwatch} />Thuê đọc</span></div>}
        {!hasData ? <div className={styles.chartEmpty}><BarChart3 size={30} /><span>Chưa có đơn đã thanh toán và hoàn thành trong kỳ.</span></div> : <div className={styles.chartScroll}>
            <div className={styles.chart} style={{ '--bar-count': points.length } as CSSProperties} aria-label={mode === 'revenue' ? 'Biểu đồ doanh thu' : 'Biểu đồ số đơn'}>
                {points.map(point => <div key={point.date} className={styles.chartPoint} tabIndex={0} title={`${point.label}: ${reportMoney(point.revenue)} · ${point.completedOrders} đơn`}>
                    <div className={styles.bars}>
                        <span className={styles.paperBar} style={{ height: `${(mode === 'orders' ? point.completedOrders : point.physicalRevenue) / maximum * 100}%` }} />
                        {mode === 'revenue' && <span className={styles.rentalBar} style={{ height: `${point.rentalRevenue / maximum * 100}%` }} />}
                    </div><span className={styles.chartLabel}>{point.label}</span>
                    <span className={styles.chartTooltip}>{point.label}<br />{mode === 'orders' ? `${point.completedOrders} đơn` : reportMoney(point.revenue)}</span>
                </div>)}
            </div>
        </div>}
    </section>;
}
