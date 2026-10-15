import { useEffect, useRef, useState } from 'react';
import { getReport, getReportPdf } from '../services/reportService';
import type { DashboardReport, ReportPeriod, ReportQuery } from '../types/report';
import { reportDates } from '../utils/reportPresentation';
import { useBookFilterOptions } from './useBookFilterOptions';
import { useToastNotifications } from './useToastNotifications';

export const useReportsController = () => {
    const [query, setQuery] = useState<ReportQuery>(() => ({ ...reportDates('month'), purchaseType: 'all', topPage: 1, topPageSize: 5, inventoryPage: 1, inventoryPageSize: 5 }));
    const [period, setPeriod] = useState<ReportPeriod>('month');
    const [report, setReport] = useState<DashboardReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [exportOpen, setExportOpen] = useState(false);
    const [detailed, setDetailed] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');
    const exporting = useRef(false);
    const options = useBookFilterOptions();
    const notifications = useToastNotifications();
    useEffect(() => {
        let active = true;
        const abort = new AbortController();
        void Promise.resolve().then(async () => {
            if (!active) return;
            setIsLoading(true); setError(''); setReport(null);
            if (!query.fromDate || !query.toDate || query.fromDate > query.toDate) { setError('Vui lòng chọn khoảng thời gian hợp lệ.'); setIsLoading(false); return; }
            try { const data = await getReport(query, abort.signal); if (active) setReport(data); }
            catch (reason) { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải báo cáo.'); }
            finally { if (active) setIsLoading(false); }
        });
        return () => { active = false; abort.abort(); };
    }, [query, refreshVersion]);
    const changeFilters = (values: Partial<ReportQuery>) => setQuery(current => ({ ...current, ...values, topPage: 1, inventoryPage: 1 }));
    const changePeriod = (value: ReportPeriod) => { setPeriod(value); if (value !== 'custom') changeFilters(reportDates(value)); };
    const changePage = (kind: 'top' | 'inventory', page: number, pageSize?: number) => setQuery(current => kind === 'top'
        ? { ...current, topPage: page, topPageSize: pageSize ?? current.topPageSize }
        : { ...current, inventoryPage: page, inventoryPageSize: pageSize ?? current.inventoryPageSize });
    const exportPdf = async () => {
        if (exporting.current || !report) return;
        exporting.current = true; setIsExporting(true);
        try {
            const pdf = await getReportPdf(query, detailed);
            const url = URL.createObjectURL(pdf);
            const link = document.createElement('a'); link.href = url; link.download = 'AncientBook_' + query.fromDate + '_' + query.toDate + '.pdf';
            link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
            setExportOpen(false); notifications.notify('Đã xuất báo cáo PDF.', 'success');
        } catch (reason) { notifications.notify(reason instanceof Error ? reason.message : 'Không thể xuất PDF.', 'error'); }
        finally { exporting.current = false; setIsExporting(false); }
    };
    return { query, period, report, isLoading, error: error || options.error, options, notifications, exportOpen, setExportOpen, detailed, setDetailed, isExporting, exportPdf, chartMode, setChartMode, changeFilters, changePeriod, changePage, refresh: () => setRefreshVersion(version => version + 1) };
};
