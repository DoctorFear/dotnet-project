import type { ReportPeriod, RevenueChartPoint, RevenuePeriod } from '../types/report';

export const reportMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
export const reportDate = (date: string) => date.slice(0, 10).split('-').reverse().join('/');
export const reportDates = (period: Exclude<ReportPeriod, 'custom'>) => {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const number = (type: string) => Number(parts.find(part => part.type === type)?.value);
    const today = new Date(Date.UTC(number('year'), number('month') - 1, number('day')));
    const from = new Date(today);
    if (period === 'month') from.setUTCDate(1);
    if (period === 'quarter') { from.setUTCDate(1); from.setUTCMonth(Math.floor(today.getUTCMonth() / 3) * 3); }
    if (period === 'last7') from.setUTCDate(from.getUTCDate() - 6);
    return { fromDate: from.toISOString().slice(0, 10), toDate: today.toISOString().slice(0, 10) };
};
export const revenueChartPoints = (periods: RevenuePeriod[]): RevenueChartPoint[] => {
    if (periods.length <= 31) return periods.map(period => ({ ...period, label: reportDate(period.date).slice(0, 5) }));
    const months = new Map<string, RevenueChartPoint>();
    periods.forEach(period => {
        const key = period.date.slice(0, 7);
        const current = months.get(key) ?? { date: key + '-01', label: key.slice(5) + '/' + key.slice(0, 4), revenue: 0, physicalRevenue: 0, rentalRevenue: 0, completedOrders: 0 };
        current.revenue += period.revenue; current.physicalRevenue += period.physicalRevenue;
        current.rentalRevenue += period.rentalRevenue; current.completedOrders += period.completedOrders;
        months.set(key, current);
    });
    return [...months.values()];
};
