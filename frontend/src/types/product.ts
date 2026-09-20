// Model DTO hiển thị giao diện Khách hàng (Storefront)
export interface ProductData {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    publisherId?: number;
    categories?: string[];
    categoryIds?: number[];
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
    isbn?: string;
    status?: 'selling' | 'upcoming' | 'stopped';
}

// Hàm hỗ trợ ánh xạ dữ liệu từ AdminBookData sang ProductData cho Khách hàng
export const mapBookToProduct = (
    book: import('./adminBook').AdminBookData,
    publisherName?: string,
    categoryNames?: string[]
): ProductData => {
    return {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: publisherName || 'Chưa cập nhật',
        publisherId: book.publisherId,
        categories: categoryNames || [],
        categoryIds: book.categoryIds,
        coverImg: book.coverImg,
        isPhysicalAvailable: book.physicalPrice > 0,
        physicalPrice: book.physicalPrice,
        isEBookAvailable: book.eBookPrice > 0,
        eBookPrice: book.eBookPrice,
        isRentalAvailable: book.weeklyRentalPrice > 0,
        weeklyRentalPrice: book.weeklyRentalPrice,
        monthlyRentalPrice: book.monthlyRentalPrice || 0,
        yearlyRentalPrice: book.yearlyRentalPrice || 0,
        stockCount: book.stockCount,
        stockStatus: book.stockCount > 5 ? 'in_stock' : book.stockCount > 0 ? 'low_stock' : 'out_of_stock',
        status: book.status,
        rating: 5.0,
        reviewsCount: 0,
    };
};