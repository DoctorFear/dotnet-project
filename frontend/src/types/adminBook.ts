export type AdminBookStatus = 'selling' | 'upcoming' | 'stopped';

export interface AdminBookData {
    id: string;
    isbn: string;
    title: string;
    author: string;
    publisherId: number;
    categoryIds: number[];
    coverImg: string;
    physicalPrice: number;
    eBookPrice: number;
    weeklyRentalPrice: number;
    stockCount: number;
    status: AdminBookStatus;
    orderCount?: number;
}
