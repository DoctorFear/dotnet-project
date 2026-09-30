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
        DatabaseFacade Database { get; }
        DbSet<User> Users { get; }
        DbSet<AuditLog> AuditLogs { get; }
        DbSet<Order> Orders { get; }
        DbSet<OrderItem> OrderItems { get; }
        public DbSet<Book> Books { get; }
        public DbSet<Inventory> Inventories { get; }
        public DbSet<BookCategory> BookCategories { get; }
        public DbSet<FPoints> FPoints { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}