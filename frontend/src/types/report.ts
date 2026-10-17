import type { PagedResult } from './book';

export type ReportPeriod = 'month' | 'today' | 'last7' | 'quarter' | 'custom';
export interface ReportQuery {
    fromDate: string;
    toDate: string;
    categoryId?: number;
    publisherId?: number;
    purchaseType: 'all' | 'physical' | 'rental';
    topPage: number;
    topPageSize: number;
    inventoryPage: number;
    inventoryPageSize: number;
}
export interface RevenuePeriod {
    date: string;
    revenue: number;
    physicalRevenue: number;
    rentalRevenue: number;
    completedOrders: number;
}
export interface TopReportBook {
    bookId: number;
    title: string;
    coverImg: string | null;
    soldQuantity: number;
    rentalQuantity: number;
    totalAmount: number;
}
export interface LowStockReportBook {
    bookId: number;
    title: string;
    isbn: string;
    coverImg: string | null;
    stockCount: number;
}
export interface DashboardReport {
    fromDate: string;
    toDate: string;
    generatedAt: string;
    totalBooks: number;
    totalSellingBooks: number;
    totalLowStockBooks: number;
    lowStockThreshold: number;
    totalRevenue: number;
    physicalRevenue: number;
    rentalRevenue: number;
    completedOrders: number;
    physicalQuantity: number;
    rentalQuantity: number;
    revenueTrend: RevenuePeriod[];
    topBooksPage: PagedResult<TopReportBook>;
    lowStockBooksPage: PagedResult<LowStockReportBook>;
}
export interface RevenueChartPoint extends RevenuePeriod { label: string; }
