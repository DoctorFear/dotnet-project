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
            await BookCatalogSeeder.SeedAsync(context);

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
