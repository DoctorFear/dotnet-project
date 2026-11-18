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
    public interface IPurchaseOrderService
    {
        Task<List<PurchaseOrderDto>> GetAllPurchaseOrdersAsync(string? status = null, int? supplierId = null, string? searchKeyword = null);
        Task<PurchaseOrderDto?> GetPurchaseOrderByIdAsync(int id);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, string? createdBy = null);
        Task<bool> UpdatePurchaseOrderAsync(int id, UpdatePurchaseOrderDto dto, string? updatedBy = null);
        Task<PurchaseOrderDto> ApprovePurchaseOrderAsync(int id, ApprovePurchaseOrderDto? dto, string approvedBy);
        Task<bool> CancelPurchaseOrderAsync(int id, string cancelReason, string? cancelledBy = null);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IStockMovementRepository _stockMovementRepository;
        private readonly IStockAlertRepository _stockAlertRepository;
        private readonly IBookRepository _bookRepository;

        public PurchaseOrderService(
            IPurchaseOrderRepository purchaseOrderRepository,
            ISupplierRepository supplierRepository,
            IInventoryRepository inventoryRepository,
            IStockMovementRepository stockMovementRepository,
            IStockAlertRepository stockAlertRepository,
            IBookRepository bookRepository)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _supplierRepository = supplierRepository;
            _inventoryRepository = inventoryRepository;
            _stockMovementRepository = stockMovementRepository;
            _stockAlertRepository = stockAlertRepository;
            _bookRepository = bookRepository;
        }

        public async Task<List<PurchaseOrderDto>> GetAllPurchaseOrdersAsync(string? status = null, int? supplierId = null, string? searchKeyword = null)
        {
            var list = await _purchaseOrderRepository.GetAllAsync(status, supplierId, searchKeyword);
            return list.Select(MapToDto).ToList();
        }

        public async Task<PurchaseOrderDto?> GetPurchaseOrderByIdAsync(int id)
        {
            var po = await _purchaseOrderRepository.GetByIdAsync(id);
            return po == null ? null : MapToDto(po);
        }

        public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, string? createdBy = null)
        {
            if (dto.Items == null || !dto.Items.Any())
            {
                throw new InvalidOperationException("Phiếu nhập kho phải có ít nhất một đầu sách.");
            }

            var supplier = await _supplierRepository.GetByIdAsync(dto.SupplierId);
            if (supplier == null)
            {
                throw new KeyNotFoundException("Không tìm thấy nhà cung cấp.");
            }

            if (!string.Equals(supplier.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Nhà cung cấp '{supplier.Name}' đã ngừng hợp tác, không thể lập phiếu nhập mới.");
            }

            foreach (var item in dto.Items)
            {
                if (item.OrderedQuantity <= 0)
                {
                    throw new InvalidOperationException("Số lượng đặt nhập của mỗi đầu sách phải lớn hơn 0.");
                }
                if (item.UnitPrice < 0)
                {
                    throw new InvalidOperationException("Đơn giá nhập không được âm.");
                }
            }

            string code = await GeneratePurchaseOrderCodeAsync();
            decimal totalAmount = dto.Items.Sum(i => i.OrderedQuantity * i.UnitPrice);

            var purchaseOrder = new PurchaseOrder
            {
                Code = code,
                SupplierId = dto.SupplierId,
                Status = dto.IsDraft ? "Draft" : "Pending",
                TotalAmount = totalAmount,
                Notes = dto.Notes?.Trim() ?? string.Empty,
                CreatedBy = createdBy,
                Items = dto.Items.Select(i => new PurchaseOrderItem
                {
                    BookId = i.BookId,
                    OrderedQuantity = i.OrderedQuantity,
                    ReceivedQuantity = 0,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            await _purchaseOrderRepository.AddAsync(purchaseOrder);
            await _purchaseOrderRepository.SaveChangesAsync();

            var created = await _purchaseOrderRepository.GetByIdAsync(purchaseOrder.Id);
            return MapToDto(created ?? purchaseOrder);
        }

        public async Task<bool> UpdatePurchaseOrderAsync(int id, UpdatePurchaseOrderDto dto, string? updatedBy = null)
        {
            var po = await _purchaseOrderRepository.GetByIdAsync(id);
            if (po == null) return false;

            if (string.Equals(po.Status, "Approved", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(po.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Không thể chỉnh sửa phiếu nhập ở trạng thái '{po.Status}'.");
            }

            if (dto.Items == null || !dto.Items.Any())
            {
                throw new InvalidOperationException("Phiếu nhập kho phải có ít nhất một đầu sách.");
            }

            po.SupplierId = dto.SupplierId;
            po.Notes = dto.Notes?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(dto.Status) &&
                (dto.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase) ||
                 dto.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase)))
            {
                po.Status = dto.Status;
            }

            po.Items.Clear();
            foreach (var item in dto.Items)
            {
                if (item.OrderedQuantity <= 0)
                {
                    throw new InvalidOperationException("Số lượng đặt nhập phải lớn hơn 0.");
                }

                po.Items.Add(new PurchaseOrderItem
                {
                    PurchaseOrderId = po.Id,
                    BookId = item.BookId,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = 0,
                    UnitPrice = item.UnitPrice
                });
            }

            po.TotalAmount = po.Items.Sum(i => i.OrderedQuantity * i.UnitPrice);
            po.UpdatedBy = updatedBy;

            _purchaseOrderRepository.Update(po);
            await _purchaseOrderRepository.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// UC32: Duyệt phiếu nhập hàng (Approve PO) trong 1 Database Transaction:
        /// - Cộng dồn tồn kho vào Inventories & Books
        /// - Ghi vết lịch sử StockMovements với StockBefore, StockAfter
        /// - Tự động giải quyết StockAlert nếu tồn mới vượt ngưỡng tối thiểu
        /// </summary>
        public async Task<PurchaseOrderDto> ApprovePurchaseOrderAsync(int id, ApprovePurchaseOrderDto? dto, string approvedBy)
        {
            var po = await _purchaseOrderRepository.GetByIdAsync(id);
            if (po == null)
            {
                throw new KeyNotFoundException("Không tìm thấy phiếu nhập kho.");
            }

            if (string.Equals(po.Status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Phiếu nhập kho này đã được duyệt trước đó.");
            }

            if (string.Equals(po.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Không thể duyệt phiếu nhập kho đã bị hủy.");
            }

            var receivedMap = dto?.ReceivedItems?
                .GroupBy(x => x.BookId)
                .ToDictionary(g => g.Key, g => g.Last().ReceivedQuantity)
                ?? new Dictionary<int, int>();

            await _purchaseOrderRepository.ExecuteInTransactionAsync(async () =>
            {
                var movements = new List<StockMovement>();

                foreach (var item in po.Items)
                {
                    int receivedQty = receivedMap.TryGetValue(item.BookId, out int customQty)
                        ? customQty
                        : item.OrderedQuantity;

                    if (receivedQty < 0)
                    {
                        throw new InvalidOperationException($"Số lượng thực nhận cho sách #{item.BookId} không được âm.");
                    }

                    item.ReceivedQuantity = receivedQty;

                    if (receivedQty == 0)
                    {
                        continue;
                    }

                    var inv = await _inventoryRepository.GetByBookIdAsync(item.BookId);
                    int stockBefore = inv?.QuantityOnHand ?? 0;
                    int stockAfter = stockBefore + receivedQty;

                    if (inv == null)
                    {
                        await _inventoryRepository.AddAsync(new Inventory
                        {
                            BookId = item.BookId,
                            QuantityOnHand = 0,
                            ReorderLevel = 5,
                            LastUpdated = TimeZoneHelper.GetVietnamTime()
                        });
                    }

                    await _inventoryRepository.IncreaseStockAsync(item.BookId, receivedQty);

                    movements.Add(new StockMovement
                    {
                        BookId = item.BookId,
                        MovementType = "Import",
                        QuantityChange = receivedQty,
                        StockBefore = stockBefore,
                        StockAfter = stockAfter,
                        Reason = $"Nhập kho theo phiếu {po.Code}",
                        CreatedBy = approvedBy
                    });

                    var activeAlert = await _stockAlertRepository.GetByBookIdAsync(item.BookId);
                    if (activeAlert != null)
                    {
                        activeAlert.CurrentStock = stockAfter;
                        if (stockAfter > activeAlert.MinThreshold)
                        {
                            activeAlert.IsResolved = true;
                        }
                        _stockAlertRepository.Update(activeAlert);
                    }
                }

                if (movements.Any())
                {
                    await _stockMovementRepository.AddRangeAsync(movements);
                }

                if (!string.IsNullOrWhiteSpace(dto?.Notes))
                {
                    po.Notes = string.IsNullOrWhiteSpace(po.Notes)
                        ? dto.Notes.Trim()
                        : $"{po.Notes} | Duyệt: {dto.Notes.Trim()}";
                }

                po.Status = "Approved";
                po.ApprovedBy = approvedBy;
                po.ApprovedAt = TimeZoneHelper.GetVietnamTime();
                po.UpdatedBy = approvedBy;
                po.TotalAmount = po.Items.Sum(i => i.ReceivedQuantity * i.UnitPrice);

                _purchaseOrderRepository.Update(po);
                await _purchaseOrderRepository.SaveChangesAsync();
            });

            var updated = await _purchaseOrderRepository.GetByIdAsync(id);
            return MapToDto(updated ?? po);
        }

        public async Task<bool> CancelPurchaseOrderAsync(int id, string cancelReason, string? cancelledBy = null)
        {
            var po = await _purchaseOrderRepository.GetByIdAsync(id);
            if (po == null) return false;

            if (string.Equals(po.Status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Phiếu nhập đã được duyệt nhập kho, không thể hủy.");
            }

            if (string.IsNullOrWhiteSpace(cancelReason))
            {
                throw new InvalidOperationException("Vui lòng nhập lý do hủy phiếu nhập.");
            }

            po.Status = "Cancelled";
            po.CancelReason = cancelReason.Trim();
            po.UpdatedBy = cancelledBy;

            _purchaseOrderRepository.Update(po);
            await _purchaseOrderRepository.SaveChangesAsync();
            return true;
        }

        private async Task<string> GeneratePurchaseOrderCodeAsync()
        {
            int year = TimeZoneHelper.GetVietnamTime().Year;
            int count = await _purchaseOrderRepository.GetCountByYearAsync(year);
            int nextNumber = count + 1;

            string candidate;
            do
            {
                candidate = $"PO-{year}-{nextNumber:D3}";
                var existing = await _purchaseOrderRepository.GetByCodeAsync(candidate);
                if (existing == null)
                {
                    break;
                }
                nextNumber++;
            } while (true);

            return candidate;
        }

        private static PurchaseOrderDto MapToDto(PurchaseOrder po)
        {
            return new PurchaseOrderDto
            {
                Id = po.Id,
                Code = po.Code,
                SupplierId = po.SupplierId,
                SupplierName = po.Supplier?.Name ?? string.Empty,
                Status = po.Status,
                TotalAmount = po.TotalAmount,
                Notes = po.Notes,
                CancelReason = po.CancelReason,
                ApprovedBy = po.ApprovedBy,
                ApprovedAt = po.ApprovedAt,
                CreatedAt = po.CreatedAt,
                CreatedBy = po.CreatedBy,
                Items = po.Items.Select(i => new PurchaseOrderItemDto
                {
                    Id = i.Id,
                    BookId = i.BookId,
                    BookTitle = i.Book?.Title ?? string.Empty,
                    Isbn = i.Book?.Isbn ?? string.Empty,
                    OrderedQuantity = i.OrderedQuantity,
                    ReceivedQuantity = i.ReceivedQuantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };
        }
    }
}
