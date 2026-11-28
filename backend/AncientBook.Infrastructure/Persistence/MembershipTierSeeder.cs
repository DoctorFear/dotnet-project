using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

/// <summary>
/// Seeds the mandatory Bronze/Silver/Gold catalog used by UC27 and UC40.
/// Existing tier configuration is preserved verbatim.
/// </summary>
public static class MembershipTierSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.MembershipTiers.AnyAsync()) return;

        await context.MembershipTiers.AddRangeAsync(
            new MembershipTier
            {
                TierName = "Đồng",
                MinSpending = 0m,
                PointRate = 5,
                Benefits = "Tích 5% F-Point cho mỗi đơn hàng hợp lệ.",
                DisplayOrder = 1,
                IsActive = true,
                CreatedBy = "MembershipTierSeeder"
            },
            new MembershipTier
            {
                TierName = "Bạc",
                MinSpending = 2_000_000m,
                PointRate = 10,
                Benefits = "Tích 10% F-Point và nhận ưu đãi thành viên Bạc.",
                DisplayOrder = 2,
                IsActive = true,
                CreatedBy = "MembershipTierSeeder"
            },
            new MembershipTier
            {
                TierName = "Vàng",
                MinSpending = 5_000_000m,
                PointRate = 15,
                Benefits = "Tích 15% F-Point và hưởng quyền lợi cao nhất.",
                DisplayOrder = 3,
                IsActive = true,
                CreatedBy = "MembershipTierSeeder"
            });

        await context.SaveChangesAsync();
    }
}
