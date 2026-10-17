import type { DashboardReport, ReportQuery } from '../types/report';
import { requestApi, requestBlob } from './apiClient';

const queryString = (query: ReportQuery) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
    return params.toString();
};
export const getReport = (query: ReportQuery, signal?: AbortSignal) => requestApi<DashboardReport>('/Reports/dashboard?' + queryString(query), { signal });
export const getReportPdf = async (query: ReportQuery, detailed: boolean) => {
    const pdf = await requestBlob('/Reports/export-pdf?' + queryString(query) + '&detailed=' + detailed, { headers: { Accept: 'application/pdf' } });
    if (pdf.type !== 'application/pdf' || pdf.size === 0) throw new Error('Hệ thống chưa trả về file PDF hợp lệ.');
    return pdf;
};
