using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
	public interface IInventoryService
	{
		Task<List<StockAlertDto>> CheckAndGenerateStockAlertsAsync();
		Task<List<StockAlertDto>> GetActiveAlertsAsync();
		Task<bool> ResolveAlertAsync(int alertId);
		Task<bool> UpdateMinThresholdAsync(UpdateThresholdDto dto);
	}

	public class InventoryService : IInventoryService
	{
		private readonly IStockAlertRepository _stockAlertRepository;
		private readonly IInventoryRepository _inventoryRepository;
		private readonly ISystemSettingRepository _systemSettingRepository;
		private readonly IBookRepository _bookRepository;

		public InventoryService(
			IStockAlertRepository stockAlertRepository,
			IInventoryRepository inventoryRepository,
			ISystemSettingRepository systemSettingRepository,
			IBookRepository bookRepository)
		{
			_stockAlertRepository = stockAlertRepository;
			_inventoryRepository = inventoryRepository;
			_systemSettingRepository = systemSettingRepository;
			_bookRepository = bookRepository;
		}

		public async Task<List<StockAlertDto>> CheckAndGenerateStockAlertsAsync()
		{
			var defaultSetting = await _systemSettingRepository.GetByKeyAsync("DefaultMinThreshold");
			int defaultThreshold = defaultSetting != null && int.TryParse(defaultSetting.SettingValue, out var val) ? val : 10;

			var inventories = await _inventoryRepository.GetAllAsync();
			var alertsToCreate = new List<StockAlert>();

			foreach (var inv in inventories)
			{
				int threshold = inv.ReorderLevel > 0 ? inv.ReorderLevel : defaultThreshold;

				if (inv.QuantityOnHand <= threshold)
				{
					var existingAlert = await _stockAlertRepository.GetByBookIdAsync(inv.BookId);
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
						existingAlert.Status = alertStatus;
					}
				}
			}

			if (alertsToCreate.Any())
			{
				await _stockAlertRepository.AddRangeAsync(alertsToCreate);
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
			return true;
		}

		public async Task<bool> UpdateMinThresholdAsync(UpdateThresholdDto dto)
		{
			var inv = await _inventoryRepository.GetByBookIdAsync(dto.BookId);
			if (inv == null) return false;

			inv.ReorderLevel = dto.NewThreshold;
			inv.LastUpdated = DateTime.UtcNow;

			await _inventoryRepository.UpdateAsync(inv);
			return true;
		}
	}
}
