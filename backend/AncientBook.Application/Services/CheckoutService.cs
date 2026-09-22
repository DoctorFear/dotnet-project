using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class CheckoutService : ICheckoutService
    {
        private readonly IApplicationDbContext _context;
        private readonly HttpClient _httpClient;

        public CheckoutService(IApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<CreateCheckoutResponse> ProcessCheckoutAsync(CreateCheckoutRequest request)
        {
            if (request.Items == null || !request.Items.Any())
            {
                throw new ArgumentException("Đơn hàng phải có ít nhất một sản phẩm sách.");
            }

            // Using transaction to ensure atomicity across orders and stock updates
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal subTotal = 0;
                var orderItemsToCreate = new List<OrderItem>();

                foreach (var itemDto in request.Items)
                {
                    // Fetch Book to get current active pricing and check existence/stock if needed
                    var book = await _context.Books.FindAsync(itemDto.BookId);
                    var invetory = await _context.Inventories.FindAsync(itemDto.BookId);
                    if (book == null || invetory == null)
                    {
                        throw new KeyNotFoundException($"Không tìm thấy sách với ID: {itemDto.BookId}");
                    }

                    if (invetory.QuantityOnHand < itemDto.Quantity)
                    {
                        throw new InvalidOperationException($"Sách '{book.Title}' không đủ số lượng trong kho. Chỉ còn lại {invetory.QuantityOnHand} sản phẩm.");
                    }
                    
                    // Adjust inventory if quanity is available
                    int rowsAffected = await _context.Inventories
                    .Where(i => i.BookId == itemDto.BookId && i.QuantityOnHand >= itemDto.Quantity)
                    .ExecuteUpdateAsync(s => s.SetProperty(
                        i => i.QuantityOnHand, 
                        i => i.QuantityOnHand - itemDto.Quantity
                    ));

                    if (rowsAffected == 0)
                    {
                        throw new InvalidOperationException($"Sách ID '{itemDto.BookId}' đã hết hàng hoặc không đủ số lượng.");
                    }

                    decimal unitPrice = book.Price; 
                    decimal itemTotal = unitPrice * itemDto.Quantity;
                    subTotal += itemTotal;

                    orderItemsToCreate.Add(new OrderItem
                    {
                        BookId = itemDto.BookId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = unitPrice
                    });
                }

                // Calculate discount logic (Integrate with Promotions table if required)
                decimal discountAmount = 0;
                // if (request.PromotionId.HasValue)
                // {
                //     var promotion = await _context.Promotions.FindAsync(request.PromotionId.Value);
                //     if (promotion != null)
                //     {
                //         // Example rule: Apply flat or percentage discount based on promotion properties
                //         // discountAmount = ...;
                //     }
                // }

                decimal finalAmount = subTotal - discountAmount;
                // if (finalAmount < 0) finalAmount = 0;

                var order = new Order
                {
                    UserId = request.UserId,
                    PromotionId = request.PromotionId,
                    OrderDate = DateTime.UtcNow,
                    SubTotal = subTotal,
                    DiscountAmount = discountAmount,
                    FinalAmount = finalAmount,
                    ShippingAddress = request.ShippingAddress,
                    Status = OrderStatus.Pending,
                    OrderItems = orderItemsToCreate
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

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
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<CreateMomoResponse> CreatePaymentUrlAsync(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
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
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
            
            var amount = ((long)order.FinalAmount).ToString();
            var orderInfo = $"Thanh toan don hang #{order.Id} tai AncientBook";
            var requestType = "captureWallet";
            var extraData = ""; // Dữ liệu mã hóa base64 nếu cần truyền thêm

            // HMAC SHA256 signature
            var rawHash = $"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";
            var signature = ComputeHmacSha256(rawHash, secretKey);

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
                await _context.SaveChangesAsync();

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
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

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
            var signature = ComputeHmacSha256(rawHash, secretKey);

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
                    await _context.SaveChangesAsync();
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

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null || order.MoMoRequestId != requestId) return;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (resultCode != 0)
                {
                    // THANH TOÁN THẤT BẠI HOẶC BỊ HỦY -> HOÀN LẠI KHO SÁCH
                    order.Status = OrderStatus.Failed;
                    
                    foreach (var item in order.OrderItems)
                    {
                        var inventory = await _context.Inventories.FindAsync(item.BookId);
                        if (inventory != null)
                        {
                            inventory.QuantityOnHand += item.Quantity;
                        }
                    }
                }
                else
                {
                    order.IsPaid = true;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(messageBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}