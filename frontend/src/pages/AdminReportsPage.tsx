import AdminLayout from '../components/layout/admin/AdminLayout';
import ReportFilters from '../components/features/admin-reports/ReportFilters';
import ReportSummary from '../components/features/admin-reports/ReportSummary';
import RevenueChart from '../components/features/admin-reports/RevenueChart';
import ReportTables from '../components/features/admin-reports/ReportTables';
import type { ReactNode } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ToastNotification from '../components/common/ToastNotification';
import { useReportsController } from '../hooks/useReportsController';
import { reportDate } from '../utils/reportPresentation';
import styles from '../components/features/admin-reports/AdminReports.module.css';

export default function AdminReportsPage() {
    const controller = useReportsController();
    const { report, query, notifications } = controller;
    const toast = <ToastNotification toasts={notifications.toasts} onClose={notifications.dismissToast} />;
    return <AdminLayout activePage="reports" title="Thống kê & Báo cáo" subtitle="Đơn đã thanh toán, hoàn thành và tồn kho sách giấy hiện tại" badge="Admin Reports">
        <div className={styles.reports}>
            {!controller.exportOpen && toast}
            {controller.exportOpen && <ReportExportDialog detailed={controller.detailed} onModeChange={controller.setDetailed} busy={controller.isExporting} onClose={() => controller.setExportOpen(false)} onExport={() => void controller.exportPdf()}>{toast}</ReportExportDialog>}
            <ReportFilters query={query} period={controller.period} categories={controller.options.categories} publishers={controller.options.publishers} onChange={controller.changeFilters} onPeriodChange={controller.changePeriod} onRefresh={controller.refresh} onExport={() => controller.setExportOpen(true)} canExport={!!report && !controller.isLoading} />
            {controller.error ? <div role="alert" className={styles.error}>{controller.error}<button type="button" onClick={controller.refresh}>Thử lại</button></div> : controller.isLoading ? <div className={styles.loading} role="status">Đang tải báo cáo...</div> : report && <>
                <div className={styles.scope}>{reportDate(report.fromDate)} đến {reportDate(report.toDate)}<span>Cập nhật {report.generatedAt.slice(11, 16)} · {reportDate(report.generatedAt)}</span></div>
                <ReportSummary report={report} /><RevenueChart periods={report.revenueTrend} mode={controller.chartMode} onModeChange={controller.setChartMode} /><ReportTables report={report} onPageChange={controller.changePage} />
            </>}
        </div>
    </AdminLayout>;
}

function ReportExportDialog({ detailed, onModeChange, busy, onClose, onExport, children }: { detailed: boolean; onModeChange: (detailed: boolean) => void; busy: boolean; onClose: () => void; onExport: () => void; children: ReactNode }) {
    return <ConfirmDialog title="Xuất báo cáo PDF" message="Phạm vi theo bộ lọc hiện tại." busy={busy} onClose={onClose} onConfirm={onExport}>
        {children}<div className={styles.exportModes}><label><input type="radio" name="report-detail" checked={!detailed} disabled={busy} onChange={() => onModeChange(false)} />Tổng hợp</label><label><input type="radio" name="report-detail" checked={detailed} disabled={busy} onChange={() => onModeChange(true)} />Chi tiết doanh thu và tồn kho</label></div>
    </ConfirmDialog>;
}
