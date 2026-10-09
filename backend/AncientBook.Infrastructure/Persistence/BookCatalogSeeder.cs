using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

public static class BookCatalogSeeder
{
    // Bổ sung danh mục, nhà xuất bản và sách mẫu còn thiếu
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await SeedInitialCatalogAsync(context);

        string[] categoryNames = ["Văn học", "Lịch sử", "Triết học", "Y học", "Tiểu thuyết", "Truyện ngắn", "Trinh thám", "Kinh tế", "Quản trị kinh doanh", "Tâm lý học", "Kỹ năng sống", "Thiếu nhi", "Khoa học", "Ngoại ngữ", "Giáo khoa", "Tiểu sử - Hồi ký"];
        string[] publisherNames = ["NXB Văn Học", "NXB Tri Thức", "NXB Trẻ", "NXB Kim Đồng", "NXB Hội Nhà Văn", "NXB Phụ Nữ Việt Nam", "NXB Giáo Dục Việt Nam", "NXB Tổng Hợp TP.HCM", "NXB Lao Động", "NXB Dân Trí"];
        var existingCategories = await context.Categories.Select(item => item.Name).ToListAsync();
        var existingPublishers = await context.Publishers.Select(item => item.Name).ToListAsync();
        context.Categories.AddRange(categoryNames.Except(existingCategories).Select(name => new Category { Name = name }));
        context.Publishers.AddRange(publisherNames.Except(existingPublishers).Select(name => new Publisher { Name = name }));
        await context.SaveChangesAsync();

        var remaining = Math.Max(0, 30 - await context.Books.CountAsync());
        if (remaining == 0) return;
        var categories = await context.Categories.ToDictionaryAsync(item => item.Name, item => item.Id);
        var publishers = await context.Publishers.OrderBy(item => item.Id).ToListAsync();
        (string Title, string Author, string Category)[] samples = [
            ("Dế Mèn Phiêu Lưu Ký", "Tô Hoài", "Thiếu nhi"),
            ("Số Đỏ", "Vũ Trọng Phụng", "Tiểu thuyết"),
            ("Chí Phèo", "Nam Cao", "Truyện ngắn"),
            ("Tắt Đèn", "Ngô Tất Tố", "Văn học"),
            ("Những Ngày Thơ Ấu", "Nguyên Hồng", "Tiểu sử - Hồi ký"),
            ("Lão Hạc", "Nam Cao", "Truyện ngắn"),
            ("Truyện Kiều", "Nguyễn Du", "Văn học"),
            ("Hai Đứa Trẻ", "Thạch Lam", "Truyện ngắn"),
            ("Gió Lạnh Đầu Mùa", "Thạch Lam", "Văn học"),
            ("Vang Bóng Một Thời", "Nguyễn Tuân", "Truyện ngắn"),
            ("Đắc Nhân Tâm", "Dale Carnegie", "Kỹ năng sống"),
            ("Tư Duy Nhanh Và Chậm", "Daniel Kahneman", "Tâm lý học"),
            ("Nhà Giả Kim", "Paulo Coelho", "Tiểu thuyết"),
            ("Hoàng Tử Bé", "Antoine de Saint-Exupéry", "Thiếu nhi"),
            ("Sherlock Holmes", "Arthur Conan Doyle", "Trinh thám"),
            ("Lược Sử Thời Gian", "Stephen Hawking", "Khoa học"),
            ("Nguồn Gốc Các Loài", "Charles Darwin", "Khoa học"),
            ("Tâm Lý Học Đám Đông", "Gustave Le Bon", "Tâm lý học"),
            ("Quốc Gia Khởi Nghiệp", "Dan Senor và Saul Singer", "Kinh tế"),
            ("Từ Tốt Đến Vĩ Đại", "Jim Collins", "Quản trị kinh doanh"),
            ("Tiếng Anh Cơ Bản", "Nhóm tác giả", "Ngoại ngữ"),
            ("Toán Học Trong Cuộc Sống", "Nhóm tác giả", "Giáo khoa"),
            ("Lịch Sử Văn Minh Thế Giới", "Nhóm tác giả", "Lịch sử"),
            ("Nhập Môn Triết Học", "Nhóm tác giả", "Triết học"),
            ("Dinh Dưỡng Và Sức Khỏe", "Nhóm tác giả", "Y học"),
            ("Nghệ Thuật Giao Tiếp", "Nhóm tác giả", "Kỹ năng sống"),
            ("Khám Phá Vũ Trụ", "Nhóm tác giả", "Khoa học"),
            ("Truyện Cổ Tích Việt Nam", "Nhóm tác giả", "Thiếu nhi"),
            ("Kinh Tế Học Cơ Bản", "Nhóm tác giả", "Kinh tế"),
            ("Hành Trình Học Tập", "Nhóm tác giả", "Giáo khoa")
        ];
        var existingIsbns = await context.Books.Select(item => item.Isbn).ToListAsync();
        for (var index = 0; index < samples.Length && remaining > 0; index++)
        {
            var isbn = $"978-604-99-{index + 1:0000}-0";
            if (existingIsbns.Contains(isbn)) continue;
            var sample = samples[index];
            context.Books.Add(new Book
            {
                Isbn = isbn, Title = sample.Title, Author = sample.Author,
                PublisherId = publishers[index % publishers.Count].Id,
                CoverImg = "https://covers.openlibrary.org/b/id/8231856-L.jpg",
                IsPhysicalAvailable = true, PhysicalPrice = 65000 + index * 5000,
                IsEBookAvailable = true, EBookPrice = 30000 + index * 2000,
                IsRentalAvailable = true, WeeklyRentalPrice = 10000,
                MonthlyRentalPrice = 25000, YearlyRentalPrice = 80000,
                Rating = new double[] { 5, 4.5, 3.5, 2.5 }[index % 4], ReviewsCount = 10 + index,
                PublicationYear = 2024 + index % 3,
                Description = $"Dữ liệu mẫu giới thiệu sách {sample.Title} của {sample.Author}.",
                BookCategories = [new BookCategory { CategoryId = categories[sample.Category] }]
            });
            remaining--;
        }
        await context.SaveChangesAsync();
    }

    // Seed catalog ban đầu và tồn kho mẫu
    private static async Task SeedInitialCatalogAsync(ApplicationDbContext context)
    {
        // Seed dữ liệu dùng chung cho danh mục sách
        if (!await context.Categories.AnyAsync())
        {
            await context.Categories.AddRangeAsync(new List<Category>
            {
                new Category { Name = "Văn học", Description = "Tác phẩm văn học trong và ngoài nước" },
                new Category { Name = "Lịch sử", Description = "Sách lịch sử và văn hóa Việt Nam" },
                new Category { Name = "Triết học", Description = "Sách tư tưởng và triết học" },
                new Category { Name = "Y học", Description = "Sách y học cổ truyền" }
            });
            await context.SaveChangesAsync();
        }

        // Seed dữ liệu dùng chung cho nhà xuất bản
        if (!await context.Publishers.AnyAsync())
        {
            await context.Publishers.AddRangeAsync(new List<Publisher>
            {
                new Publisher { Name = "NXB Văn Học", Address = "Hà Nội" },
                new Publisher { Name = "NXB Tri Thức", Address = "Hà Nội" },
                new Publisher { Name = "NXB Trẻ", Address = "TP. Hồ Chí Minh" }
            });
            await context.SaveChangesAsync();
        }

        var categories = await context.Categories.OrderBy(category => category.Id).ToListAsync();
        var publishers = await context.Publishers.OrderBy(publisher => publisher.Id).ToListAsync();

        // ==================== 1. SEED 10 CUỐN SÁCH MẪU ====================
        if (!await context.Books.AnyAsync(book => book.Isbn == "978-604-0-00001-0"))
        {
            var sampleBooks = new List<Book>
            {
                new Book
                {
                    Isbn = "978-604-0-00001-0",
                    Title = "Đại Việt Sử Ký Toàn Thư",
                    Author = "Ngô Sĩ Liên",
                    PhysicalPrice = 120000,
                    EBookPrice = 60000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00002-7",
                    Title = "Lĩnh Nam Chích Quái",
                    Author = "Trần Thế Pháp",
                    PhysicalPrice = 85000,
                    EBookPrice = 45000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00003-4",
                    Title = "Truyền Kỳ Mạn Lục",
                    Author = "Nguyễn Dữ",
                    PhysicalPrice = 95000,
                    EBookPrice = 50000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00004-1",
                    Title = "Việt Nam Sử Lược",
                    Author = "Trần Trọng Kim",
                    PhysicalPrice = 150000,
                    EBookPrice = 70000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00005-8",
                    Title = "Nam Triều Công Nghiệp Diễn Chí",
                    Author = "Nguyễn Khoa Chiêm",
                    PhysicalPrice = 110000,
                    EBookPrice = 55000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00006-5",
                    Title = "Hoàng Lê Nhất Thống Chí",
                    Author = "Ngô Gia Văn Phái",
                    PhysicalPrice = 135000,
                    EBookPrice = 65000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00007-2",
                    Title = "Khâm Định Việt Sử Thông Giám Cương Mục",
                    Author = "Quốc Sử Quán Triều Nguyễn",
                    PhysicalPrice = 250000,
                    EBookPrice = 120000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00008-9",
                    Title = "Gia Định Thành Thông Chí",
                    Author = "Trịnh Hoài Đức",
                    PhysicalPrice = 140000,
                    EBookPrice = 70000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00009-6",
                    Title = "Bình Ngô Đại Cáo & Thơ Văn Nguyễn Trãi",
                    Author = "Nguyễn Trãi",
                    PhysicalPrice = 100000,
                    EBookPrice = 50000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Book
                {
                    Isbn = "978-604-0-00010-2",
                    Title = "Hải Thượng Y Tông Tâm Lĩnh",
                    Author = "Lê Hữu Trác",
                    PhysicalPrice = 300000,
                    EBookPrice = 150000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = false,
                    CreatedAt = DateTime.UtcNow
                }
            };

            var coverImages = new[]
            {
                "https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg",
                "https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg",
                "https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg"
            };

            for (var index = 0; index < sampleBooks.Count; index++)
            {
                var book = sampleBooks[index];
                book.PublisherId = publishers[index % publishers.Count].Id;
                book.CoverImg = coverImages[index % coverImages.Length];
                book.IsEBookAvailable = true;
                book.IsRentalAvailable = true;
                book.WeeklyRentalPrice = 15000 + (index * 1000);
                book.MonthlyRentalPrice = 35000 + (index * 2000);
                book.YearlyRentalPrice = 95000 + (index * 5000);
                book.Rating = 4.2 + ((index % 4) * 0.2);
                book.ReviewsCount = 12 + (index * 7);
                book.StockCount = 8 + (index * 3);
                book.PublicationYear = 2020 + (index % 6);
                book.Description = $"Ấn bản giới thiệu tác phẩm {book.Title}.";
                book.BookCategories.Add(new BookCategory { CategoryId = categories[index % categories.Count].Id });
            }

            await context.Books.AddRangeAsync(sampleBooks);
            await context.SaveChangesAsync();

            // Sau khi lưu, sampleBooks đã có Id thật do DB sinh (1 -> 10)
            var inventories = new List<Inventory>();
            foreach (var book in sampleBooks)
            {
                inventories.Add(new Inventory
                {
                    BookId = book.Id,
                    QuantityOnHand = 50,
                    ReorderLevel = 5,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                });
            }

            await context.Inventories.AddRangeAsync(inventories);
            await context.SaveChangesAsync();
        }
    }
}
