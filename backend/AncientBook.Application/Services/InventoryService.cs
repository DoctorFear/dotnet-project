using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public interface IInventoryService
    {
        Task<List<InventoryStockDto>> GetAllInventoryStocksAsync();
        Task<List<StockAlertDto>> CheckAndGenerateStockAlertsAsync();
        Task<List<StockAlertDto>> GetActiveAlertsAsync();
        Task<bool> ResolveAlertAsync(int alertId);
        Task<bool> UpdateMinThresholdAsync(UpdateThresholdDto dto);
        Task<List<StockMovementDto>> GetStockMovementsAsync(int? bookId = null, string? movementType = null);
    }

    public class InventoryService : IInventoryService
    {
        private readonly IStockAlertRepository _stockAlertRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly ISystemSettingRepository _systemSettingRepository;
        private readonly IBookRepository _bookRepository;
        private readonly IStockMovementRepository _stockMovementRepository;

        public InventoryService(
            IStockAlertRepository stockAlertRepository,
            IInventoryRepository inventoryRepository,
            ISystemSettingRepository systemSettingRepository,
            IBookRepository bookRepository,
            IStockMovementRepository stockMovementRepository)
        {
            _stockAlertRepository = stockAlertRepository;
            _inventoryRepository = inventoryRepository;
            _systemSettingRepository = systemSettingRepository;
            _bookRepository = bookRepository;
            _stockMovementRepository = stockMovementRepository;
        }

        public async Task<List<InventoryStockDto>> GetAllInventoryStocksAsync()
        {
            var books = await _bookRepository.GetAllAsync();
            var inventories = await _inventoryRepository.GetAllAsync();
            var invDict = inventories.ToDictionary(i => i.BookId, i => i);

            return books
                .OrderBy(b => b.Id)
                .Select(b =>
                {
                    invDict.TryGetValue(b.Id, out var inv);
                    return new InventoryStockDto
                    {
                        BookId = b.Id,
                        BookTitle = b.Title,
                        Isbn = b.Isbn,
                        PhysicalPrice = b.PhysicalPrice,
                        QuantityOnHand = inv?.QuantityOnHand ?? b.StockCount,
                        ReorderLevel = inv?.ReorderLevel ?? 5,
                        LastUpdated = inv?.LastUpdated ?? b.UpdatedAt ?? b.CreatedAt
                    };
                })
                .ToList();
        }

        public async Task<List<StockAlertDto>> CheckAndGenerateStockAlertsAsync()
        {
            var setting = await _systemSettingRepository.GetByKeyAsync("LowStockThreshold")
                       ?? await _systemSettingRepository.GetByKeyAsync("DefaultMinThreshold");
            int defaultThreshold = setting != null && int.TryParse(setting.SettingValue, out var val) ? val : 10;

            var inventories = await _inventoryRepository.GetAllAsync();
            var alertsToCreate = new List<StockAlert>();
            bool hasUpdates = false;

            foreach (var inv in inventories)
            {
                int threshold = inv.ReorderLevel > 0 ? inv.ReorderLevel : defaultThreshold;
                var existingAlert = await _stockAlertRepository.GetByBookIdAsync(inv.BookId);

                if (inv.QuantityOnHand <= threshold)
                {
                    string alertStatus = inv.QuantityOnHand <= 0 ? "OutOfStock" : "LowStock";

                    if (existingAlert == null)
                    {
                        alertsToCreate.Add(new StockAlert
                        {
                            BookId = inv.BookId,
                            CurrentStock = inv.QuantityOnHand,
                            MinThreshold = threshold,
                            Status = alertStatus,
                            IsResolved = false
                        });
                    }
                    else
                    {
                        existingAlert.CurrentStock = inv.QuantityOnHand;
                        existingAlert.MinThreshold = threshold;
                        existingAlert.Status = alertStatus;
                        _stockAlertRepository.Update(existingAlert);
                        hasUpdates = true;
                    }
                }
                else if (existingAlert != null)
                {
                    existingAlert.CurrentStock = inv.QuantityOnHand;
                    existingAlert.MinThreshold = threshold;
                    existingAlert.IsResolved = true;
                    _stockAlertRepository.Update(existingAlert);
                    hasUpdates = true;
                }
            }

            if (alertsToCreate.Any())
            {
                await _stockAlertRepository.AddRangeAsync(alertsToCreate);
                hasUpdates = true;
            }

            if (hasUpdates)
            {
                await _stockAlertRepository.SaveChangesAsync();
            }

            return await GetActiveAlertsAsync();
        }

        public async Task<List<StockAlertDto>> GetActiveAlertsAsync()
        {
            var alerts = await _stockAlertRepository.GetActiveAlertsAsync();
            var books = await _bookRepository.GetAllAsync();
            var bookDict = books.ToDictionary(b => b.Id, b => b);

            return alerts.Select(a => new StockAlertDto
            {
                Id = a.Id,
                BookId = a.BookId,
                BookTitle = bookDict.ContainsKey(a.BookId) ? bookDict[a.BookId].Title : string.Empty,
                Isbn = bookDict.ContainsKey(a.BookId) ? bookDict[a.BookId].Isbn : string.Empty,
                CurrentStock = a.CurrentStock,
                MinThreshold = a.MinThreshold,
                Status = a.Status,
                IsResolved = a.IsResolved,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        public async Task<bool> ResolveAlertAsync(int alertId)
        {
            var alert = await _stockAlertRepository.GetByIdAsync(alertId);
            if (alert == null) return false;

            alert.IsResolved = true;
            _stockAlertRepository.Update(alert);
            await _stockAlertRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateMinThresholdAsync(UpdateThresholdDto dto)
        {
            if (dto.NewThreshold < 0)
            {
                throw new InvalidOperationException("Ngưỡng tồn kho tối thiểu không được âm.");
            }

            var inv = await _inventoryRepository.GetByBookIdAsync(dto.BookId);
            if (inv == null)
            {
                var books = await _bookRepository.GetAllAsync();
                var book = books.FirstOrDefault(b => b.Id == dto.BookId);
                if (book == null) return false;

                inv = new Inventory
                {
                    BookId = dto.BookId,
                    QuantityOnHand = book.StockCount,
                    ReorderLevel = dto.NewThreshold,
                    LastUpdated = TimeZoneHelper.GetVietnamTime()
                };
                await _inventoryRepository.AddAsync(inv);
            }
            else
            {
                inv.ReorderLevel = dto.NewThreshold;
                inv.LastUpdated = TimeZoneHelper.GetVietnamTime();
                await _inventoryRepository.UpdateAsync(inv);
            }

            // Tự động quét và phát sinh / cập nhật cảnh báo ngay khi thay đổi ngưỡng tồn tối thiểu
            await CheckAndGenerateStockAlertsAsync();
            return true;
        }

        public async Task<List<StockMovementDto>> GetStockMovementsAsync(int? bookId = null, string? movementType = null)
        {
            var movements = await _stockMovementRepository.GetAllAsync(bookId, movementType);
            var books = await _bookRepository.GetAllAsync();
            var bookDict = books.ToDictionary(b => b.Id, b => b);

            return movements.Select(m => new StockMovementDto
            {
                Id = m.Id,
                BookId = m.BookId,
                BookTitle = bookDict.ContainsKey(m.BookId) ? bookDict[m.BookId].Title : string.Empty,
                Isbn = bookDict.ContainsKey(m.BookId) ? bookDict[m.BookId].Isbn : string.Empty,
                MovementType = m.MovementType,
                QuantityChange = m.QuantityChange,
                StockBefore = m.StockBefore,
                StockAfter = m.StockAfter,
                Reason = m.Reason,
                CreatedAt = m.CreatedAt,
                CreatedBy = m.CreatedBy
            }).ToList();
        }
    }
}
