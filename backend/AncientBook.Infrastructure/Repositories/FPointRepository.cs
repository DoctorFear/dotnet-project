using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Domain.Entities;
using AncientBook.Application.Interfaces;
using AncientBook.Infrastructure.Persistence;

namespace AncientBook.Infrastructure.Repositories
{
    public class FPointsRepository : IFPointRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly int conversionFactor = 1000;

        public FPointsRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(FPoints record)
        {
            _context.FPoints.Add(record);
            await _context.SaveChangesAsync();
        }

        public async Task<FPoints?> GetAsync(int userId, int orderId)
        {
            var record = await _context.FPoints.FirstOrDefaultAsync(p => p.UserId == userId && p.OrderId == orderId);
            return record;
        }

        public async Task<int> GetCurrentUserPointsAsync(int userId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user?.FPoints ?? 0;
        }

        public async Task IncreasePointsAsync(int userId, int points, int? orderId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found.");
            }

            user.FPoints += points;

            if (orderId.HasValue)
            {
                var pointRecord = new FPoints
                {
                    UserId = userId,
                    OrderId = orderId.Value,
                    PointUsed = -points
                };
                _context.FPoints.Add(pointRecord);
            }

            await _context.SaveChangesAsync();
        }

        public async Task DecreasePointsAsync(int userId, int points, int? orderId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found.");
            }

            if (user.FPoints < points)
            {
                throw new InvalidOperationException("User does not have enough FPoints.");
            }

            user.FPoints -= points;

            if (orderId.HasValue)
            {
                var pointRecord = new FPoints
                {
                    UserId = userId,
                    OrderId = orderId.Value,
                    PointUsed = points
                };
                _context.FPoints.Add(pointRecord);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> CalculateAndAwardPointsAsync(int userId, decimal totalAmount, int? orderId = null)
        {
            int earnedPoints = (int)(totalAmount / conversionFactor);

            if (earnedPoints > 0)
            {
                if (earnedPoints > 1000)
                {
                    earnedPoints = 1000;       
                }
                await IncreasePointsAsync(userId, earnedPoints, orderId);
            }

            return earnedPoints;
        }
    }
}