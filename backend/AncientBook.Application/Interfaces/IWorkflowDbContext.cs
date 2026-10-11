using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace AncientBook.Application.Interfaces;

public interface IWorkflowDbContext
{
    DatabaseFacade Database { get; }
    DbSet<T> Set<T>() where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginWorkflowTransactionAsync();
    Task LockOrderAsync(int id);
    Task LockUserAsync(int id);
    Task LockBookAsync(int id);
}
