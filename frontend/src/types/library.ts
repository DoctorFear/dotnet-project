export interface LibraryBook {
    id: string;
    title: string;
    author: string;
    coverImg: string;
    type: 'owned' | 'rented';
    rentExpireDays?: number;
    isExpired?: boolean;
    lastReadProgress?: number;
}