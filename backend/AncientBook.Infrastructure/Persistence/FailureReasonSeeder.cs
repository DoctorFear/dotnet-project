using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

public static class FailureReasonSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.FailureReasons.AnyAsync()) return;

        await context.FailureReasons.AddRangeAsync(
            new FailureReason
            {
                ReasonText = "Không liên lạc được khách",
                Description = "Shipper đã liên hệ nhiều lần nhưng khách hàng không phản hồi.",
                DisplayOrder = 1,
                IsActive = true,
                CreatedBy = "FailureReasonSeeder"
            },
            new FailureReason
            {
                ReasonText = "Khách từ chối nhận",
                Description = "Khách hàng từ chối nhận kiện hàng khi giao.",
                DisplayOrder = 2,
                IsActive = true,
                CreatedBy = "FailureReasonSeeder"
            },
            new FailureReason
            {
                ReasonText = "Sai địa chỉ giao hàng",
                Description = "Địa chỉ nhận hàng không đúng hoặc không thể xác định.",
                DisplayOrder = 3,
                IsActive = true,
                CreatedBy = "FailureReasonSeeder"
            },
            new FailureReason
            {
                ReasonText = "Khách hẹn lại quá 3 lần",
                Description = "Khách hàng đã hẹn giao lại vượt quá số lần cho phép.",
                DisplayOrder = 4,
                IsActive = true,
                CreatedBy = "FailureReasonSeeder"
            });

        await context.SaveChangesAsync();
    }
}
