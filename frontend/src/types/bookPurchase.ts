import type { ProductData } from './book';

export type BookPurchaseFormat = 'physical' | 'ebook' | 'rental';
export type BookRentalDuration = 'week' | 'month' | 'year';
export type PurchasableBook = Pick<ProductData, 'id' | 'title' | 'isPhysicalAvailable' | 'physicalPrice' | 'isEBookAvailable' | 'eBookPrice' | 'isRentalAvailable' | 'weeklyRentalPrice' | 'monthlyRentalPrice' | 'yearlyRentalPrice' | 'stockCount'>;

export interface BookPurchaseSelection {
    format: BookPurchaseFormat;
    duration: BookRentalDuration;
    quantity: number;
}
