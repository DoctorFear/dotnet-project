using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class CheckoutService : ICheckoutService
    {
        private readonly IBookRepository _bookRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IFPointRepository _fpointRepository;
        private readonly IHmacSha256Hasher _hasher;
        private readonly HttpClient _httpClient;
        private readonly ILogger<CheckoutService> _logger;

        public CheckoutService(IBookRepository bookRepository, IInventoryRepository inventoryRepository, IOrderRepository orderRepository, IFPointRepository fpointRepository, IUserRepository userRepository, IHmacSha256Hasher hasher, HttpClient httpClient, ILogger<CheckoutService> logger)
        {
            _bookRepository = bookRepository;
            _inventoryRepository = inventoryRepository;
            _orderRepository = orderRepository;
            _fpointRepository = fpointRepository;
            _httpClient = httpClient;
            _hasher = hasher;
            _logger = logger;
        }

        public async Task<CreateCheckoutResponse> ProcessCheckoutAsync(CreateCheckoutRequest request)
        {
            if (request.Items == null || !request.Items.Any())
            {
                throw new ArgumentException("Đơn hàng phải có ít nhất một sản phẩm sách.");
            }

            decimal subTotal = 0;
            var orderItemsToCreate = new List<OrderItem>();
            var processedPhysicalInventories = new List<(int bookId, int quantity)>();

            try {
                foreach (var itemDto in request.Items)
                {
                    var book = await _bookRepository.GetByIdAsync(itemDto.BookId);

                    if (book == null)
                    {
                        throw new KeyNotFoundException($"Không tìm thấy sách với ID: {itemDto.BookId}");
                    }
                    
                    decimal unitPrice = 0;
                    DateTime? rentalStart = null;
                    DateTime? rentalEnd = null;

                    if (itemDto.PurchaseType == PurchaseType.Physical)
                    {
                        if (!book.IsPhysicalAvailable)
                        {
                            throw new InvalidOperationException($"Sách '{book.Title}' hiện không hỗ trợ bán bản vật lý.");
                        }

                        var inventory = await _inventoryRepository.GetByBookIdAsync(itemDto.BookId);
                        if (inventory == null || inventory.QuantityOnHand < itemDto.Quantity)
                        {
                            throw new InvalidOperationException($"Sách '{book.Title}' không đủ số lượng trong kho.");
                        }

                        bool success = await _inventoryRepository.DecreaseStockAsync(itemDto.BookId, itemDto.Quantity);
                        if (!success)
                        {
                            throw new InvalidOperationException($"Sách ID '{itemDto.BookId}' đã hết hàng.");
                        }

                        processedPhysicalInventories.Add((itemDto.BookId, itemDto.Quantity));
                        unitPrice = book.PhysicalPrice;
                    }
                    else if (itemDto.PurchaseType == PurchaseType.Rental)
                    {
                        if (!book.IsRentalAvailable)
                        {
                            throw new InvalidOperationException($"Sách '{book.Title}' không hỗ trợ cho thuê online.");
                        }

                        rentalStart = TimeZoneHelper.GetVietnamTime();

                        switch (itemDto.RentalDuration)
                        {
                            case RentalDurationType.Weekly:
                                unitPrice = book.WeeklyRentalPrice;
                                rentalEnd = rentalStart.Value.AddDays(7);
                                break;
                            case RentalDurationType.Monthly:
                                unitPrice = book.MonthlyRentalPrice;
                                rentalEnd = rentalStart.Value.AddMonths(1);
                                break;
                            case RentalDurationType.Yearly:
                                unitPrice = book.YearlyRentalPrice;
                                rentalEnd = rentalStart.Value.AddYears(1);
                                break;
                            default:
                                throw new ArgumentException("Gói thời gian thuê không hợp lệ.");
                        }
                    }
                }

                decimal discountAmount = 0;
                var userFpoints = await _fpointRepository.GetCurrentUserPointsAsync(request.UserId);

                if (request.PointsUsed > 0 && request.PointsUsed <= userFpoints && request.PointsUsed < 1000)
                {
                    discountAmount = (decimal)request.PointsUsed * 10;
                }

                decimal finalAmount = subTotal - discountAmount;
                if (finalAmount < 0) finalAmount = 0;

                var order = new Order
                {
                    UserId = request.UserId,
                    OrderDate = DateTime.UtcNow,
                    SubTotal = subTotal,
                    DiscountAmount = discountAmount,
                    FinalAmount = finalAmount,
                    ShippingAddress = request.ShippingAddress,
                    Status = OrderStatus.Pending,
                    OrderItems = orderItemsToCreate
                };

                await _orderRepository.AddAsync(order);

                if (request.PointsUsed > 0 && discountAmount > 0)
                {
                    await _fpointRepository.DecreasePointsAsync(request.UserId, (int)request.PointsUsed, order.Id);
                }
                else
                {
                    await _fpointRepository.CalculateAndAwardPointsAsync(request.UserId, finalAmount, order.Id);
                }
                
                var fPointRecord = _fpointRepository.GetAsync(order.UserId, order.Id);
                if (fPointRecord != null)
                {
                    order.PointsId = fPointRecord.Id;
                    await _orderRepository.UpdateAsync(order);
                }

                await _orderRepository.AddAsync(order);

                return new CreateCheckoutResponse
                {
                    OrderId = order.Id,
                    Status = order.Status,
                    SubTotal = order.SubTotal,
                    DiscountAmount = order.DiscountAmount,
                    FinalAmount = order.FinalAmount,
                    OrderDate = order.OrderDate,
                    Message = "Đặt hàng thành công!"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình xử lý đơn hàng. Đang tiến hành hoàn lại kho...");
                foreach (var (bookId, quantity) in processedPhysicalInventories)
                {
                    try
                    {
                        await _inventoryRepository.IncreaseStockAsync(bookId, quantity);
                    }
                    catch (Exception compEx)
                    {
                        _logger.LogError(
                            compEx, 
                            "LỖI NGHIÊM TRỌNG: Không thể hoàn lại {Quantity} sản phẩm cho sách ID {BookId} trong quá trình rollback đơn hàng.", 
                            quantity, 
                            bookId
                        );
                    }
                }
                throw;
            }
        }

        public async Task<CreateMomoResponse> CreatePaymentUrlAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }

            var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
            var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
            var secretKey = Environment.GetEnvironmentVariable("SECRETKEY") ?? "";
            var endpoint = Environment.GetEnvironmentVariable("CREATEURL");
            var redirectUrl = Environment.GetEnvironmentVariable("REDIRECTURL");
            var ipnUrl = Environment.GetEnvironmentVariable("IPNURL");

            var requestId = Guid.NewGuid().ToString();
            order.MoMoRequestId = requestId;
            
            await _orderRepository.UpdateAsync(order);
            
            var amount = ((long)order.FinalAmount).ToString();
            var orderInfo = $"Thanh toan don hang #{order.Id} tai AncientBook";
            var requestType = "captureWallet";
            var extraData = "";

            var rawHash = $"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";
            var signature = _hasher.ComputeHmacSha256(rawHash, secretKey);

            var payload = new
            {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang = "vi"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, content);
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Lỗi kết nối tới cổng thanh toán MoMo.");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            if (root.TryGetProperty("resultCode", out var resultCode) && resultCode.GetInt32() == 0)
            {
                var payUrl = root.GetProperty("payUrl").GetString()!;
                var qrCodeUrl = root.TryGetProperty("qrCodeUrl", out var qrProp) ? qrProp.GetString() ?? "" : "";

                order.PayUrl = payUrl;
                await _orderRepository.UpdateAsync(order);

                return new CreateMomoResponse
                {
                    OrderId = order.Id,
                    PayUrl = payUrl,
                    QrCodeUrl = qrCodeUrl,
                    Amount = order.FinalAmount,
                    Message = "Tạo yêu cầu thanh toán MoMo thành công."
                };
            }

            var message = root.TryGetProperty("message", out var msg) ? msg.GetString() : "Lỗi không xác định";
            throw new Exception($"Không thể tạo giao dịch MoMo: {message}");
        }
        
        public async Task<GetMomoResponse> QueryMoMoPaymentStatusAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }

            var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
            var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
            var secretKey = Environment.GetEnvironmentVariable("SECRETKEY") ?? "";
            var endpoint = Environment.GetEnvironmentVariable("QUERYURL");

            var requestId = order.MoMoRequestId ?? Guid.NewGuid().ToString();

            var rawHash = $"accessKey={accessKey}&orderId={orderId}&partnerCode={partnerCode}&requestId={requestId}";
            var signature = _hasher.ComputeHmacSha256(rawHash, secretKey);

            var payload = new
            {
                partnerCode,
                accessKey,
                requestId,
                orderId = orderId.ToString(),
                signature,
                lang = "vi"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, content);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Lỗi kết nối tới cổng kiểm tra giao dịch MoMo.");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            string message = root.TryGetProperty("message", out var msgProp) ? msgProp.GetString() ?? "" : "Không có thông điệp";
            string deeplink = root.TryGetProperty("deeplink", out var deeplinkProp) ? deeplinkProp.GetString() ?? "" : "Không có deeplink";
            string qrCodeUrl = root.TryGetProperty("qrCodeUrl", out var qrProp) ? qrProp.GetString() ?? "" : "Không có mã QR";
            string deeplinkWebInApp = root.TryGetProperty("deeplinkWebInApp", out var deeplinkWIAProp) ? deeplinkWIAProp.GetString() ?? "" : "Không có deeplink web in app";

            if (root.TryGetProperty("resultCode", out var resultCode) && resultCode.GetInt32() == 0)
            {
                if (!order.IsPaid)
                {
                    order.IsPaid = true;
                    await _orderRepository.UpdateAsync(order);
                }
            }

            return new GetMomoResponse
            {
                OrderId = order.Id,
                RequestId = requestId,
                IsPaid = order.IsPaid,
                PaymentUrl = order.PayUrl ?? string.Empty,
                Deeplink = deeplink,
                QrCodeUrl = qrCodeUrl,
                DeeplinkWebInApp = deeplinkWebInApp,
                Message = message
            };
        }

        public async Task HandleMoMoIpnAsync(JsonElement ipnData)
        {
            var orderIdStr = ipnData.GetProperty("orderId").GetString();
            var resultCode = ipnData.GetProperty("resultCode").GetInt32();
            var requestId = ipnData.GetProperty("requestId").GetString();

            if (!int.TryParse(orderIdStr, out int orderId)) return;

            var order = await _orderRepository.GetByIdAsync(orderId);

            if (order == null || order.MoMoRequestId != requestId) return;

            if (resultCode != 0)
            {
                order.Status = OrderStatus.Failed;
                
                foreach (var item in order.OrderItems)
                {
                    var inventory = await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
                }
            }
            else
            {
                order.IsPaid = true;
            }

            await _orderRepository.UpdateAsync(order);
        }
    }
}