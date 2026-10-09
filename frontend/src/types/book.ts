export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface BookData {
    id: number;
    isbn: string;
    title: string;
    author: string;
    publisherId: number | null;
    publisher: string | null;
    categoryIds: number[]; // Quan hệ N-N: 1 sách thuộc nhiều thể loại
    categories: string[];
    coverImg: string;
    isPhysicalAvailable: boolean;
    physicalPrice: number; // Giá bán sách giấy
    isEBookAvailable: boolean;
    eBookPrice: number; // Giá bán E-book sở hữu vĩnh viễn (Nếu = 0 nghĩa là KHÔNG bán online)
    isRentalAvailable: boolean;
    weeklyRentalPrice: number; // Giá thuê theo Tuần (Chỉ mở khi eBookPrice > 0)
    monthlyRentalPrice: number; // Giá thuê theo Tháng (Chỉ mở khi eBookPrice > 0)
    yearlyRentalPrice: number; // Giá thuê theo Năm (Chỉ mở khi eBookPrice > 0)
    rating: number;
    reviewsCount: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    stockCount: number; // Tồn kho sách vật lý (Chỉ được cập nhật qua Phiếu Nhập Kho)
    status: 'selling' | 'upcoming' | 'stopped';
}

export interface BookDetailData extends BookData {
    pages: number | null;
    weight: number | null; // Dùng để tính phí vận chuyển
    publicationYear: number | null;
    description: string | null;
    eBookFilePath: string | null;
    galleryImages: string[];
}

// Model DTO hiển thị giao diện Khách hàng (Storefront)
export type ProductData = BookData & { isWishlisted?: boolean };
export type AdminBookStatus = BookData['status'];
// Thực thể Sách đầy đủ dữ liệu trong CSDL hệ thống (3NF)
export type AdminBookData = BookData & Partial<Omit<BookDetailData, keyof BookData>> & { orderCount?: number };

export interface BookFilterParams {
    searchTerm?: string;
    categoryIds?: number[];
    publisherIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    publicationYear?: number;
    minRating?: number;
    maxRatingExclusive?: number;
    status?: string;
    sortBy?: string;
    pageNumber?: number;
    pageSize?: number;
}

export type SaveBookRequest = Omit<BookData, 'id' | 'publisher' | 'categories' | 'rating' | 'reviewsCount' | 'stockStatus' | 'stockCount'>
    & Partial<Omit<BookDetailData, keyof BookData>>;
