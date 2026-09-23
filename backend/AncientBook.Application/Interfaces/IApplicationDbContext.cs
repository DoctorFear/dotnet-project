using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore.Infrastructure;
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */
/* CẬP NHẬT CÁC REPOSITORY RIÊNG ĐI - SẼ XÓA FILE NÀY */




namespace AncientBook.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<AuditLog> AuditLogs { get; }
        DbSet<Order> Orders { get; }
        DbSet<OrderItem> OrderItems { get; }
        DatabaseFacade Database { get; }
        public DbSet<Book> Books { get; }
        public DbSet<Inventory> Inventories { get; }
        public DbSet<BookCategory> BookCategories { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}