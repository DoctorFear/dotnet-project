using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AncientBook.Infrastructure.Persistence
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            // ==================== 1. SEED 10 CUỐN SÁCH MẪU ====================
            if (!await context.Books.AnyAsync())
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

            // ==================== 2. SEED TÀI KHOẢN USERS ====================
            if (await context.Users.AnyAsync())
            {
                return;
            }

            string defaultHash = passwordHasher.HashPassword("Password@123");

            var users = new List<User>
            {
                // ==================== 5 ADMINS ====================
                new User
                {
                    Username = "superadmin",
                    Email = "superadmin@ancientbook.com",
                    FullName = "Super Administrator",
                    PhoneNumber = "0901000001",
                    PasswordHash = defaultHash,
                    Role = UserRole.Admin,
                    IsSuperAdmin = true,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "admin_hoang",
                    Email = "hoang.admin@ancientbook.com",
                    FullName = "Nguyễn Văn Hoàng",
                    PhoneNumber = "0901000002",
                    PasswordHash = defaultHash,
                    Role = UserRole.Admin,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "admin_linh",
                    Email = "linh.admin@ancientbook.com",
                    FullName = "Trần Thị Mai Linh",
                    PhoneNumber = "0901000003",
                    PasswordHash = defaultHash,
                    Role = UserRole.Admin,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "admin_tuan",
                    Email = "tuan.admin@ancientbook.com",
                    FullName = "Lê Anh Tuấn",
                    PhoneNumber = "0901000004",
                    PasswordHash = defaultHash,
                    Role = UserRole.Admin,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "admin_tam",
                    Email = "tam.admin@ancientbook.com",
                    FullName = "Phạm Minh Tâm",
                    PhoneNumber = "0901000005",
                    PasswordHash = defaultHash,
                    Role = UserRole.Admin,
                    IsSuperAdmin = false,
                    IsActive = false,
                    TokenVersion = 1,
                    FPoints = 0
                },

                // ==================== 5 STAFFS ====================
                new User
                {
                    Username = "staff_khoa",
                    Email = "khoa.staff@ancientbook.com",
                    FullName = "Đặng Đăng Khoa",
                    PhoneNumber = "0902000001",
                    PasswordHash = defaultHash,
                    Role = UserRole.Staff,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "staff_ngoc",
                    Email = "ngoc.staff@ancientbook.com",
                    FullName = "Võ Như Ngọc",
                    PhoneNumber = "0902000002",
                    PasswordHash = defaultHash,
                    Role = UserRole.Staff,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "staff_phuc",
                    Email = "phuc.staff@ancientbook.com",
                    FullName = "Bùi Hồng Phúc",
                    PhoneNumber = "0902000003",
                    PasswordHash = defaultHash,
                    Role = UserRole.Staff,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "staff_quynh",
                    Email = "quynh.staff@ancientbook.com",
                    FullName = "Đỗ Trúc Quỳnh",
                    PhoneNumber = "0902000004",
                    PasswordHash = defaultHash,
                    Role = UserRole.Staff,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "staff_hung",
                    Email = "hung.staff@ancientbook.com",
                    FullName = "Hồ Mạnh Hùng",
                    PhoneNumber = "0902000005",
                    PasswordHash = defaultHash,
                    Role = UserRole.Staff,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },

                // ==================== 5 SHIPPERS ====================
                new User
                {
                    Username = "shipper_duy",
                    Email = "duy.shipper@ancientbook.com",
                    FullName = "Ngô Bá Duy",
                    PhoneNumber = "0903000001",
                    PasswordHash = defaultHash,
                    Role = UserRole.Shipper,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "shipper_bao",
                    Email = "bao.shipper@ancientbook.com",
                    FullName = "Dương Quốc Bảo",
                    PhoneNumber = "0903000002",
                    PasswordHash = defaultHash,
                    Role = UserRole.Shipper,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "shipper_thang",
                    Email = "thang.shipper@ancientbook.com",
                    FullName = "Trịnh Quyết Thắng",
                    PhoneNumber = "0903000003",
                    PasswordHash = defaultHash,
                    Role = UserRole.Shipper,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "shipper_nam",
                    Email = "nam.shipper@ancientbook.com",
                    FullName = "Vũ Hải Nam",
                    PhoneNumber = "0903000004",
                    PasswordHash = defaultHash,
                    Role = UserRole.Shipper,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },
                new User
                {
                    Username = "shipper_khanh",
                    Email = "khanh.shipper@ancientbook.com",
                    FullName = "Lý Gia Khánh",
                    PhoneNumber = "0903000005",
                    PasswordHash = defaultHash,
                    Role = UserRole.Shipper,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 0
                },

                // ==================== 5 MEMBERS ====================
                new User
                {
                    Username = "member_an",
                    Email = "an.customer@gmail.com",
                    FullName = "Phan Thúy An",
                    PhoneNumber = "0904000001",
                    PasswordHash = defaultHash,
                    Role = UserRole.Member,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 150
                },
                new User
                {
                    Username = "member_binh",
                    Email = "binh.customer@gmail.com",
                    FullName = "Cao Thanh Bình",
                    PhoneNumber = "0904000002",
                    PasswordHash = defaultHash,
                    Role = UserRole.Member,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 80
                },
                new User
                {
                    Username = "member_cuong",
                    Email = "cuong.customer@gmail.com",
                    FullName = "Huỳnh Chí Cường",
                    PhoneNumber = "0904000003",
                    PasswordHash = defaultHash,
                    Role = UserRole.Member,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 200
                },
                new User
                {
                    Username = "member_dung",
                    Email = "dung.customer@gmail.com",
                    FullName = "Đinh Thùy Dung",
                    PhoneNumber = "0904000004",
                    PasswordHash = defaultHash,
                    Role = UserRole.Member,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 350
                },
                new User
                {
                    Username = "member_giang",
                    Email = "giang.customer@gmail.com",
                    FullName = "Mai Trường Giang",
                    PhoneNumber = "0904000005",
                    PasswordHash = defaultHash,
                    Role = UserRole.Member,
                    IsSuperAdmin = false,
                    IsActive = true,
                    TokenVersion = 1,
                    FPoints = 50
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }
    }
}