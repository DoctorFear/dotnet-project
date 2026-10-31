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
using AncientBook.Infrastructure.Repositories;

namespace AncientBook.Application.Services
{
    public class CheckoutService : ICheckoutService
    {
        private readonly IBookRepository _bookRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IFPointRepository _fpointRepository;
        private readonly ICartRepository _cartRepository;
        private readonly IHmacSha256Hasher _hasher;
        private readonly HttpClient _httpClient;
        private readonly ILogger<CheckoutService> _logger;
        private readonly IWorkflowDbContext _workflow;
        private readonly IFPointService _loyalty;

        public CheckoutService(IBookRepository bookRepository, IInventoryRepository inventoryRepository, IOrderRepository orderRepository, IFPointRepository fpointRepository, IUserRepository userRepository, ICartRepository cartRepository, IHmacSha256Hasher hasher, HttpClient httpClient, ILogger<CheckoutService> logger, IWorkflowDbContext workflow, IFPointService loyalty)
        {
            _bookRepository = bookRepository;
            _inventoryRepository = inventoryRepository;
            _orderRepository = orderRepository;
            _cartRepository = cartRepository;
            _fpointRepository = fpointRepository;
            _httpClient = httpClient;
            _hasher = hasher;
            _logger = logger;
            _workflow = workflow;
            _loyalty = loyalty;
        }

        public async Task<CreateCheckoutResponse> ProcessCheckoutAsync(CreateCheckoutRequest request)
        {
            if (request.Items == null || !request.Items.Any())
            {
                throw new ArgumentException("Đơn hàng phải có ít nhất một sản phẩm sách.");
            }
            if (request.PointsUsed < 0 || request.Items.Any(i => i.Quantity <= 0 || !Enum.IsDefined(i.PurchaseType)))
                throw new ArgumentException("Số lượng sách và số điểm sử dụng không hợp lệ.");

            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();

            decimal subTotal = 0;
            var orderItemsToCreate = new List<OrderItem>();
            var processedPhysicalInventories = new List<(int bookId, int quantity)>();

            try {
                foreach (var itemDto in request.Items)
                {
                    await WorkflowSupport.LockBookAsync(_workflow, itemDto.BookId);
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

                        // Cộng thời hạn thuê từ hạn đọc còn lại.
                        var currentRentalEnd = await _workflow.Set<OrderItem>()
                            .Where(i => i.BookId == itemDto.BookId &&
                                i.PurchaseType == PurchaseType.Rental &&
                                i.Order != null && i.Order.UserId == request.UserId &&
                                i.Order.Status == OrderStatus.Completed && i.Order.IsPaid &&
                                i.RentalEndDate > rentalStart)
                            .MaxAsync(i => i.RentalEndDate);
                        var rentalBaseDate = currentRentalEnd ?? rentalStart.Value;

                        switch (itemDto.RentalDuration)
                        {
                            case RentalDurationType.Weekly:
                                unitPrice = book.WeeklyRentalPrice;
                                rentalEnd = rentalBaseDate.AddDays(7);
                                break;
                            case RentalDurationType.Monthly:
                                unitPrice = book.MonthlyRentalPrice;
                                rentalEnd = rentalBaseDate.AddMonths(1);
                                break;
                            case RentalDurationType.Yearly:
                                unitPrice = book.YearlyRentalPrice;
                                rentalEnd = rentalBaseDate.AddYears(1);
                                break;
                            default:
                                throw new ArgumentException("Gói thời gian thuê không hợp lệ.");
                        }
                    }
                    subTotal += unitPrice * itemDto.Quantity;
                    orderItemsToCreate.Add(new OrderItem
                    {
                        BookId = itemDto.BookId, Quantity = itemDto.Quantity, UnitPrice = unitPrice,
                        PurchaseType = itemDto.PurchaseType, RentalDuration = itemDto.RentalDuration,
                        RentalStartDate = rentalStart, RentalEndDate = rentalEnd
                    });
                }

                decimal discountAmount = 0;
                var userFpoints = await _fpointRepository.GetCurrentUserPointsAsync(request.UserId);

                if (request.PointsUsed > 0)
                {
                    var limit = Math.Min(1000, await WorkflowSupport.IntSettingAsync(_workflow, "MAX_POINTS_PER_ORDER", 1000));
                    if (request.PointsUsed > userFpoints || request.PointsUsed > limit || request.PointsUsed * 100m > subTotal * 0.5m)
                        throw new InvalidOperationException("Số điểm vượt số dư hoặc hạn mức cho đơn hàng.");
                    discountAmount = (decimal)request.PointsUsed * 100;
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
                    PaymentMethod = "COD",
                    Status = OrderStatus.Pending,
                    OrderItems = orderItemsToCreate
                };

                await _orderRepository.AddAsync(order);
                await _orderRepository.SaveChangesAsync();
                WorkflowSupport.Audit(_workflow, "OrderCreated", "Order", order.Id, null,
                    new { order.Status, order.SubTotal, order.DiscountAmount, order.FinalAmount }, request.UserId);
                foreach (var entry in processedPhysicalInventories)
                    WorkflowSupport.Audit(_workflow, "CheckoutStockReserved", "Book", entry.bookId, null,
                        new { ReservedQuantity = entry.quantity }, request.UserId, $"Đơn #{order.Id}");

                if (request.PointsUsed > 0 && discountAmount > 0)
                {
                    await _fpointRepository.DecreasePointsAsync(request.UserId, (int)request.PointsUsed, order.Id);
                }
                var fPointRecord = await _fpointRepository.GetAsync(order.UserId, order.Id);
                if (fPointRecord != null)
                {
                    order.PointsId = fPointRecord.Id;
                    await _orderRepository.UpdateAsync(order);
                }

                await _workflow.SaveChangesAsync();
                await transaction.CommitAsync();

                try 
                {
                    var cart = await _cartRepository.GetByUserIdAsync(request.UserId);
                    if (cart != null && cart.CartItems != null)
                    {
                        foreach (var itemDto in request.Items)
                        {
                            var cartItem = cart.CartItems.FirstOrDefault(ci => 
                                ci.BookId == itemDto.BookId && ci.PurchaseType == itemDto.PurchaseType);
                                
                            if (cartItem != null)
                            {
                                await _cartRepository.RemoveItemAsync(cartItem);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Lỗi hệ thống: Không thể xóa sản phẩm khỏi giỏ hàng cho đơn hàng #{OrderId}", order.Id);
                }

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
                // The transaction rolls back stock, the order and points together.
                _logger.LogError(ex, "Không thể tạo đơn hàng. Giao dịch đã bị hủy.");
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
                order.PaymentMethod = "MoMo";
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
                await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
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
            var orderIdStr = ipnData.GetProperty("orderId").ToString();
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
            if (resultCode == 0) await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
        }

        public async Task<bool> IsOrderOnlinePaidAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            return order.IsPaid;
        }

        public async Task<string> CreateVnPayUrlAsync(int orderId, string clientIpAddress)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }

            var tmnCode = Environment.GetEnvironmentVariable("VNPAY_TMNCODE");
            var hashSecret = Environment.GetEnvironmentVariable("VNPAY_HASHSECRET");
            var vnpUrl = Environment.GetEnvironmentVariable("VNPAY_URL");
            var returnUrl = Environment.GetEnvironmentVariable("VNPAY_RETURNURL");

            if (string.IsNullOrEmpty(tmnCode) || string.IsNullOrEmpty(hashSecret) || string.IsNullOrEmpty(vnpUrl))
            {
                throw new Exception("Chưa cấu hình biến môi trường cho VNPay.");
            }

            var vnpayData = new SortedDictionary<string, string>(new VnPayCompare())
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", tmnCode },
                { "vnp_Amount", ((long)(order.FinalAmount * 100)).ToString() },
                { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", string.IsNullOrEmpty(clientIpAddress) ? "127.0.0.1" : clientIpAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan don hang {order.Id} tai AncientBook" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", returnUrl },
                { "vnp_TxnRef", $"{order.Id}_{DateTime.Now.Ticks}" }
            };

            var queryData = new StringBuilder();
            var hashData = new StringBuilder();

            foreach (var kv in vnpayData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    hashData.Append(kv.Key).Append('=').Append(Uri.EscapeDataString(kv.Value)).Append('&');
                    queryData.Append(kv.Key).Append('=').Append(Uri.EscapeDataString(kv.Value)).Append('&');
                }
            }

            if (hashData.Length > 0) hashData.Remove(hashData.Length - 1, 1);
            if (queryData.Length > 0) queryData.Remove(queryData.Length - 1, 1);

            string queryUrl = queryData.ToString();
            string vnpSecureHash = ComputeHmacSha512(hashData.ToString(), hashSecret);
            queryUrl += "&vnp_SecureHash=" + vnpSecureHash;

            string paymentUrl = $"{vnpUrl}?{queryUrl}"; 

            order.PayUrl = paymentUrl;
            order.PaymentMethod = "VNPay";
            await _orderRepository.UpdateAsync(order);

            return paymentUrl;
        }

        private string ComputeHmacSha512(string text, string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var textBytes = Encoding.UTF8.GetBytes(text);
            using var hmac = new System.Security.Cryptography.HMACSHA512(keyBytes);
            var hashBytes = hmac.ComputeHash(textBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }

        private class VnPayCompare : IComparer<string>
        {
            public int Compare(string x, string y)
            {
                if (x == y) return 0;
                if (x == null) return -1;
                if (y == null) return 1;
                var vnpCompare = string.Compare(x, y, StringComparison.Ordinal);
                if (vnpCompare != 0) return vnpCompare;
                return string.Compare(x, y, StringComparison.Ordinal);
            }
        }

        public async Task<string> CreateSePayUrlAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }

            var sepayBaseUrl = Environment.GetEnvironmentVariable("SEPAY_URL"); 
            var amount = (long)order.FinalAmount;
            var memo = $"AB{order.Id}";

            var paymentUrl = $"{sepayBaseUrl}&amount={amount}&des={memo}";
            
            order.PayUrl = paymentUrl;
            order.PaymentMethod = "SePay";
            await _orderRepository.UpdateAsync(order);

            return paymentUrl;
        }

        public async Task HandleSePayIpnAsync(JsonElement ipnData)
        {
            if (ipnData.TryGetProperty("transferType", out var typeProp) && typeProp.GetString() == "in" &&
                ipnData.TryGetProperty("transferAmount", out var amountProp) &&
                ipnData.TryGetProperty("content", out var contentProp))
            {
                long transferAmount = amountProp.GetInt64();
                string content = contentProp.GetString()?.ToUpper() ?? "";

                var match = System.Text.RegularExpressions.Regex.Match(content, @"AB(\d+)");
                if (match.Success && int.TryParse(match.Groups[1].Value, out int orderId))
                {
                    var order = await _orderRepository.GetByIdAsync(orderId);
                    if (order != null && !order.IsPaid && order.FinalAmount <= transferAmount)
                    {
                        order.IsPaid = true;
                        await _orderRepository.UpdateAsync(order);
                        await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
                    }
                }
            }
        }
    }
}
