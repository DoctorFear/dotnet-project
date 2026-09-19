export interface ProductData {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    categories?: string[];
    coverImg: string;
    isPhysicalAvailable?: boolean;
    physicalPrice?: number;
    isEBookAvailable?: boolean;
    eBookPrice?: number;
    isRentalAvailable?: boolean;
    weeklyRentalPrice?: number;
    monthlyRentalPrice?: number;
    yearlyRentalPrice?: number;
    rating?: number;
    reviewsCount?: number;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
    stockCount?: number;
    isWishlisted?: boolean;
}