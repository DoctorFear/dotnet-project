export type AdminBookStatus = 'selling' | 'upcoming' | 'stopped';

// Thực thể Sách đầy đủ dữ liệu trong CSDL hệ thống (3NF)
export interface AdminBookData {
    id: string;
    isbn: string;
    title: string;
    author: string;
    publisherId: number;
    categoryIds: number[]; // Quan hệ N-N: 1 sách thuộc nhiều thể loại
    coverImg: string;
    physicalPrice: number; // Giá bán sách giấy
    eBookPrice: number; // Giá bán E-book sở hữu vĩnh viễn (Nếu = 0 nghĩa là KHÔNG bán online)
    weeklyRentalPrice: number; // Giá thuê theo Tuần (Chỉ mở khi eBookPrice > 0)
    monthlyRentalPrice: number; // Giá thuê theo Tháng (Chỉ mở khi eBookPrice > 0)
    yearlyRentalPrice: number; // Giá thuê theo Năm (Chỉ mở khi eBookPrice > 0)
    stockCount: number; // Tồn kho sách vật lý (Chỉ được cập nhật qua Phiếu Nhập Kho)
    status: AdminBookStatus;
    pages?: number;
    publishYear?: number;
    weight?: number; // Dùng để tính phí vận chuyển
    description?: string;
    orderCount?: number;
}