using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
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
            if (existingIsbns.Contains(isbn))
            {
                continue;
            }

            var sample = samples[index];
            var profile = ResolveSampleProfile(index);
            var stockStatus = profile.StockCount > 0
                ? StockStatus.InStock
                : StockStatus.OutOfStock;

            var newBook = new Book
            {
                Isbn = isbn,
                Title = sample.Title,
                Author = sample.Author,
                PublisherId = publishers[index % publishers.Count].Id,
                CoverImg = "https://covers.openlibrary.org/b/id/8231856-L.jpg",
                IsPhysicalAvailable = profile.IsPhysical,
                PhysicalPrice = profile.IsPhysical ? 65000 + index * 5000 : 0,
                IsEBookAvailable = profile.IsEBook,
                EBookPrice = 30000 + index * 2000,
                IsRentalAvailable = profile.IsRental,
                WeeklyRentalPrice = 10000,
                MonthlyRentalPrice = 25000,
                YearlyRentalPrice = 80000,
                Rating = 0,
                ReviewsCount = 0,
                PublicationYear = 2024 + index % 3,
                StockCount = profile.StockCount,
                StockStatus = stockStatus,
                Status = profile.Status,
                Description = $"Dữ liệu mẫu giới thiệu sách {sample.Title} của {sample.Author}.",
                BookCategories =
                [
                    new BookCategory
                    {
                        CategoryId = categories[sample.Category]
                    }
                ]
            };

            context.Books.Add(newBook);
            context.Inventories.Add(new Inventory
            {
                Book = newBook,
                QuantityOnHand = profile.StockCount,
                ReorderLevel = 5
            });
            remaining--;
        }
        await context.SaveChangesAsync();
    }

    private readonly record struct SampleBookProfile(
        bool IsPhysical,
        bool IsEBook,
        bool IsRental,
        BookStatus Status,
        int StockCount);

    // Phân bổ đa dạng tổ hợp hình thức bán (1/3, 2/3, 3/3) và trạng thái cho 20 sách bổ sung
    private static SampleBookProfile ResolveSampleProfile(int index)
    {
        return index switch
        {
            19 => new(true, true, true, BookStatus.Selling, 50),
            18 => new(true, true, false, BookStatus.Selling, 0),
            17 => new(false, true, false, BookStatus.Upcoming, 0),
            16 => new(true, true, false, BookStatus.Selling, 50),
            15 => new(false, true, true, BookStatus.Stopped, 0),
            14 => new(true, false, false, BookStatus.Selling, 50),
            9 => new(true, false, false, BookStatus.Stopped, 0),
            8 => new(false, true, true, BookStatus.Upcoming, 0),
            _ => (index % 5) switch
            {
                0 => new(true, false, false, BookStatus.Selling, 50),
                1 => new(true, true, false, BookStatus.Selling, 50),
                2 => new(true, true, true, BookStatus.Selling, 50),
                3 => new(false, true, false, BookStatus.Upcoming, 0),
                _ => new(true, true, true, BookStatus.Selling, 50)
            }
        };
    }

    // Phân bổ đa dạng tổ hợp hình thức bán (1/3, 2/3, 3/3) và trạng thái cho 10 sách khởi tạo ban đầu
    private static SampleBookProfile ResolveInitialCatalogProfile(int index)
    {
        return index switch
        {
            3 => new(false, true, false, BookStatus.Upcoming, 0),
            7 => new(false, true, true, BookStatus.Upcoming, 0),
            _ => (index % 4) switch
            {
                0 => new(true, false, false, BookStatus.Selling, 50),
                1 => new(true, true, false, BookStatus.Selling, 50),
                _ => new(true, true, true, BookStatus.Selling, 50)
            }
        };
    }

    // Seed catalog ban đầu; tồn kho chỉ tăng qua dữ liệu nhập kho.
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
                var profile = ResolveInitialCatalogProfile(index);

                book.PublisherId = publishers[index % publishers.Count].Id;
                book.CoverImg = coverImages[index % coverImages.Length];
                book.IsPhysicalAvailable = profile.IsPhysical;
                book.PhysicalPrice = profile.IsPhysical ? book.PhysicalPrice : 0;
                book.IsEBookAvailable = profile.IsEBook;
                book.IsRentalAvailable = profile.IsRental;
                book.WeeklyRentalPrice = 15000 + (index * 1000);
                book.MonthlyRentalPrice = 35000 + (index * 2000);
                book.YearlyRentalPrice = 95000 + (index * 5000);
                book.Rating = 0;
                book.ReviewsCount = 0;
                book.StockCount = profile.StockCount;
                book.StockStatus = profile.StockCount > 0
                    ? StockStatus.InStock
                    : StockStatus.OutOfStock;
                book.Status = profile.Status;
                book.PublicationYear = 2020 + (index % 6);
                book.Description = $"Ấn bản giới thiệu tác phẩm {book.Title}.";
                book.BookCategories.Add(new BookCategory
                {
                    CategoryId = categories[index % categories.Count].Id
                });
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
                    QuantityOnHand = book.StockCount,
                    ReorderLevel = 5,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                });
            }

            await context.Inventories.AddRangeAsync(inventories);
            await context.SaveChangesAsync();

            var ebookBooks = await context.Books
                .Where(b => b.IsEBookAvailable)
                .OrderBy(b => b.Id)
                .ToListAsync();

            if (ebookBooks.Count == 0) return;

            var existingBookIds = await context.EbookEditions
                .Select(e => e.BookId)
                .Distinct()
                .ToListAsync();

            var now = TimeZoneHelper.GetVietnamTime();

            var seedPdfDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "ebooks");
            Directory.CreateDirectory(seedPdfDir);

            foreach (var book in ebookBooks)
            {
                if (existingBookIds.Contains(book.Id)) continue;

                var edition = new EbookEdition
                {
                    BookId = book.Id,
                    FileTitle = $"{book.Isbn}.pdf",
                    Format = EbookFormat.Pdf,
                    DropboxPath = $"/ebooks/{book.Isbn}.pdf",
                    FileSizeBytes = 1_048_576,
                    TotalPages = 4,
                    PresetType = EbookPresetType.PdfStandard,
                    Status = EditionPublishStatus.Published,
                    PublishedAt = now,
                    IsTtsEnabled = true,
                    CreatedBy = "BookCatalogSeeder"
                };

                context.EbookEditions.Add(edition);
                await context.SaveChangesAsync();

                var segments = new List<BookTtsSegment>
                {
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 1,
                        SegmentIndex = 0,
                        TextContent = $"{book.Title} — Tác giả: {book.Author}.",
                        CreatedAt = now
                    },
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 1,
                        SegmentIndex = 1,
                        TextContent = book.Description ?? $"Giới thiệu nội dung tác phẩm {book.Title}.",
                        CreatedAt = now
                    },
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 2,
                        SegmentIndex = 0,
                        TextContent = $"Chương I: Bối cảnh và khởi đầu của {book.Title}. Người đọc có thể nhấp vào từng đoạn văn để kích hoạt giọng đọc AI hoặc bôi đen văn bản để hỏi trợ lý Copilot.",
                        CreatedAt = now
                    },
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 2,
                        SegmentIndex = 1,
                        TextContent = "Từng trang sách được chia thành các khối văn bản độc lập giúp đồng bộ hóa âm thanh và trích dẫn ngữ cảnh chính xác theo số trang.",
                        CreatedAt = now
                    },
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 3,
                        SegmentIndex = 0,
                        TextContent = $"Chương II: Những luận điểm và giá trị cốt lõi trong {book.Title}.",
                        CreatedAt = now
                    },
                    new()
                    {
                        EditionId = edition.Id,
                        PageNumber = 4,
                        SegmentIndex = 0,
                        TextContent = $"Tổng kết tác phẩm {book.Title}. Cảm ơn bạn đã đọc sách tại ancientBOOK.",
                        CreatedAt = now
                    }
                };

                context.BookTtsSegments.AddRange(segments);
                await context.SaveChangesAsync();
            }
        }
    }

    private static byte[] CreateSamplePdfBytes(string title, string author, string isbn, int pageCount)
    {
        var sb = new System.Text.StringBuilder();
        var offsets = new List<int> { 0 };

        void WriteObj(int id, string body)
        {
            offsets.Add(System.Text.Encoding.ASCII.GetByteCount(sb.ToString()));
            sb.Append($"{id} 0 obj\n{body}\nendobj\n");
        }

        // Standard PDF 1.4 Header
        sb.Append("%PDF-1.4\n");

        // 1: Catalog, 2: Pages root, 3: Built-in Helvetica Font
        WriteObj(1, "<< /Type /Catalog /Pages 2 0 R >>");

        var kids = string.Join(" ", Enumerable.Range(0, pageCount).Select(i => $"{4 + i * 2} 0 R"));
        WriteObj(2, $"<< /Type /Pages /Kids [ {kids} ] /Count {pageCount} >>");
        WriteObj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        // Strip non-ASCII accents for standard Type1 Helvetica stream safety
        static string SafeAscii(string input)
        {
            var normalized = input.Normalize(System.Text.NormalizationForm.FormD);
            var chars = normalized.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
                .Select(c => c == 'đ' ? 'd' : c == 'Đ' ? 'D' : c)
                .Where(c => c >= 32 && c <= 126)
                .ToArray();
            return new string(chars).Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
        }

        var safeTitle = SafeAscii(title);
        var safeAuthor = SafeAscii(author);

        for (int p = 0; p < pageCount; p++)
        {
            int pageObjId = 4 + p * 2;
            int contentObjId = 5 + p * 2;

            string contentStream =
                $"BT /F1 18 Tf 50 750 Td ({safeTitle}) Tj " +
                $"0 -28 Td /F1 12 Tf (Author: {safeAuthor} | ISBN: {isbn}) Tj " +
                $"0 -28 Td (Page {p + 1} of {pageCount} - AncientBook Sample E-Book) Tj ET";

            WriteObj(pageObjId,
                $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {contentObjId} 0 R >>");
            WriteObj(contentObjId,
                $"<< /Length {contentStream.Length} >>\nstream\n{contentStream}\nendstream");
        }

        int xrefOffset = System.Text.Encoding.ASCII.GetByteCount(sb.ToString());
        sb.Append($"xref\n0 {offsets.Count}\n");
        sb.Append("0000000000 65535 f \n");
        for (int i = 1; i < offsets.Count; i++)
        {
            sb.Append($"{offsets[i]:D10} 00000 n \n");
        }

        sb.Append($"trailer\n<< /Size {offsets.Count} /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF");
        return System.Text.Encoding.ASCII.GetBytes(sb.ToString());
    }
}
