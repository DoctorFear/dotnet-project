using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Security.Cryptography;
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

        private static void EnsureOwnedPendingPayment(Order order, int requesterUserId)
        {
            if (order.UserId != requesterUserId)
                throw new UnauthorizedAccessException("Bạn không có quyền thanh toán hoặc xem trạng thái đơn này.");
            if (order.Status != OrderStatus.Pending || order.IsPaid)
                throw new InvalidOperationException("Chỉ tạo thanh toán cho đơn đang chờ và chưa thanh toán.");
            if (IsPaymentExpired(order))
                throw new InvalidOperationException("Đơn đã quá thời hạn thanh toán 15 phút.");
        }

        private static bool IsPaymentExpired(Order order)
        {
            var createdUtc = order.OrderDate.Kind switch
            {
                DateTimeKind.Utc => order.OrderDate,
                DateTimeKind.Local => order.OrderDate.ToUniversalTime(),
                _ => DateTime.SpecifyKind(order.OrderDate, DateTimeKind.Utc)
            };
            return createdUtc.AddMinutes(15) <= DateTime.UtcNow;
        }

        private static string JsonText(JsonElement data, string propertyName)
        {
            if (!data.TryGetProperty(propertyName, out var value))
                throw new InvalidOperationException($"Thiếu trường {propertyName} trong thông báo thanh toán.");
            return value.ValueKind == JsonValueKind.String ? value.GetString() ?? string.Empty : value.ToString();
        }

        private static bool SecureEquals(string left, string right)
        {
            var leftBytes = Encoding.UTF8.GetBytes(left);
            var rightBytes = Encoding.UTF8.GetBytes(right);
            return leftBytes.Length == rightBytes.Length
                && CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
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
                    else if (itemDto.PurchaseType == PurchaseType.EBook)
                    {
                        if (!book.IsEBookAvailable)
                        {
                            throw new InvalidOperationException($"Sách '{book.Title}' không hỗ trợ mua E-Book online.");
                        }
                        unitPrice = book.EBookPrice;
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
                    if (request.PointsUsed > userFpoints || request.PointsUsed > limit || request.PointsUsed * 100m > subTotal)
                        throw new InvalidOperationException("Số điểm vượt số dư, hạn mức 1.000 điểm hoặc tiền sách của đơn hàng.");
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

        public async Task<CreateMomoResponse> CreatePaymentUrlAsync(int orderId, int requesterUserId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            EnsureOwnedPendingPayment(order, requesterUserId);

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PARTNERCODE"))
                || string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ACCESSKEY"))
                || string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SECRETKEY"))
                || string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("CREATEURL")))
                throw new InvalidOperationException("Chưa cấu hình đầy đủ cổng thanh toán MoMo.");

            var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
            var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
            var secretKey = Environment.GetEnvironmentVariable("SECRETKEY") ?? "";
            var endpoint = Environment.GetEnvironmentVariable("CREATEURL");
            var redirectUrl = Environment.GetEnvironmentVariable("REDIRECTURL");
            var ipnUrl = Environment.GetEnvironmentVariable("IPNURL");

            var requestId = Guid.NewGuid().ToString();
            order.MoMoRequestId = requestId;
            order.PaymentMethod = "MoMo";

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
        
        public async Task<GetMomoResponse> QueryMoMoPaymentStatusAsync(int orderId, int? requesterUserId = null)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            if (requesterUserId.HasValue && order.UserId != requesterUserId.Value)
                throw new UnauthorizedAccessException("Bạn không có quyền xem trạng thái thanh toán đơn này.");
            if (!string.Equals(order.PaymentMethod, "MoMo", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(order.MoMoRequestId))
                throw new InvalidOperationException("Đơn chưa có giao dịch MoMo để kiểm tra.");

            var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
            var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
            var secretKey = Environment.GetEnvironmentVariable("SECRETKEY") ?? "";
            var endpoint = Environment.GetEnvironmentVariable("QUERYURL");
            if (string.IsNullOrWhiteSpace(partnerCode) || string.IsNullOrWhiteSpace(accessKey)
                || string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(endpoint))
                throw new InvalidOperationException("Chưa cấu hình đầy đủ API tra cứu MoMo.");

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

            var responseAmount = JsonText(root, "amount");
            var responseExtraData = JsonText(root, "extraData");
            var responseMessage = JsonText(root, "message");
            var responseOrderId = JsonText(root, "orderId");
            var responsePartnerCode = JsonText(root, "partnerCode");
            var responsePayType = JsonText(root, "payType");
            var responseRequestId = JsonText(root, "requestId");
            var responseTime = JsonText(root, "responseTime");
            var responseResultCode = JsonText(root, "resultCode");
            var responseTransId = JsonText(root, "transId");
            var responseSignature = JsonText(root, "signature");
            var responseRawHash = $"accessKey={accessKey}&amount={responseAmount}&extraData={responseExtraData}"
                + $"&message={responseMessage}&orderId={responseOrderId}&partnerCode={responsePartnerCode}"
                + $"&payType={responsePayType}&requestId={responseRequestId}&responseTime={responseTime}"
                + $"&resultCode={responseResultCode}&transId={responseTransId}";
            if (!SecureEquals(_hasher.ComputeHmacSha256(responseRawHash, secretKey), responseSignature)
                || !SecureEquals(partnerCode ?? string.Empty, responsePartnerCode))
                throw new UnauthorizedAccessException("Chữ ký phản hồi tra cứu MoMo không hợp lệ.");

            if (int.TryParse(responseResultCode, out var successfulResult) && successfulResult == 0)
            {
                if (responseOrderId != orderId.ToString(CultureInfo.InvariantCulture)
                    || !SecureEquals(requestId, responseRequestId)
                    || !decimal.TryParse(responseAmount, NumberStyles.Number, CultureInfo.InvariantCulture, out var paidAmount)
                    || paidAmount != decimal.Truncate(order.FinalAmount))
                    throw new InvalidOperationException("Phản hồi MoMo không khớp giao dịch của đơn hàng.");
                order.IsPaid = await ConfirmReconciledPaymentAsync(order.Id, "MoMo", order.FinalAmount);
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
            var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
            var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
            var secretKey = Environment.GetEnvironmentVariable("SECRETKEY");
            if (string.IsNullOrWhiteSpace(partnerCode) || string.IsNullOrWhiteSpace(accessKey)
                || string.IsNullOrWhiteSpace(secretKey))
                throw new InvalidOperationException("Chưa cấu hình khóa xác thực MoMo.");

            var amountText = JsonText(ipnData, "amount");
            var extraData = JsonText(ipnData, "extraData");
            var message = JsonText(ipnData, "message");
            var orderIdText = JsonText(ipnData, "orderId");
            var orderInfo = JsonText(ipnData, "orderInfo");
            var orderType = JsonText(ipnData, "orderType");
            var callbackPartnerCode = JsonText(ipnData, "partnerCode");
            var payType = JsonText(ipnData, "payType");
            var requestId = JsonText(ipnData, "requestId");
            var responseTime = JsonText(ipnData, "responseTime");
            var resultCodeText = JsonText(ipnData, "resultCode");
            var transId = JsonText(ipnData, "transId");
            var suppliedSignature = JsonText(ipnData, "signature");
            var rawHash = $"accessKey={accessKey}&amount={amountText}&extraData={extraData}"
                + $"&message={message}&orderId={orderIdText}&orderInfo={orderInfo}&orderType={orderType}"
                + $"&partnerCode={callbackPartnerCode}&payType={payType}&requestId={requestId}"
                + $"&responseTime={responseTime}&resultCode={resultCodeText}&transId={transId}";
            var expectedSignature = _hasher.ComputeHmacSha256(rawHash, secretKey);
            if (!SecureEquals(expectedSignature, suppliedSignature)
                || !SecureEquals(partnerCode, callbackPartnerCode))
                throw new UnauthorizedAccessException("Chữ ký thông báo MoMo không hợp lệ.");
            if (!int.TryParse(orderIdText, out var orderId)
                || !int.TryParse(resultCodeText, out var resultCode)
                || !decimal.TryParse(amountText, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
                throw new InvalidOperationException("Dữ liệu thông báo MoMo không hợp lệ.");

            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_workflow, orderId);
            var order = await _workflow.Set<Order>().Include(item => item.OrderItems)
                .FirstOrDefaultAsync(item => item.Id == orderId)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}.");
            if (!string.Equals(order.PaymentMethod, "MoMo", StringComparison.OrdinalIgnoreCase)
                || !SecureEquals(order.MoMoRequestId ?? string.Empty, requestId)
                || amount != decimal.Truncate(order.FinalAmount))
                throw new InvalidOperationException("Thông báo MoMo không khớp giao dịch của đơn hàng.");

            if (resultCode != 0)
            {
                if (!order.IsPaid && order.Status == OrderStatus.Pending)
                {
                    order.PayUrl = null;
                    order.UpdatedBy = "MoMo-IPN";
                    WorkflowSupport.Audit(_workflow, "OnlinePaymentAttemptFailed", "Order", order.Id, null,
                        new { Method = "MoMo", ResultCode = resultCode, Message = message },
                        details: "Giữ đơn trong cửa sổ 15 phút để khách có thể thử lại.");
                    await _workflow.SaveChangesAsync();
                }
                await transaction.CommitAsync();
                return;
            }
            if (order.IsPaid)
            {
                await transaction.CommitAsync();
                return;
            }
            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Đơn không còn chờ thanh toán; cần đối soát thủ công giao dịch đến muộn.");

            order.IsPaid = true;
            order.UpdatedBy = "MoMo-IPN";
            WorkflowSupport.Audit(_workflow, "OnlinePaymentConfirmed", "Order", order.Id,
                new { IsPaid = false }, new { order.IsPaid, Method = "MoMo", Amount = amount, TransId = transId });
            await _workflow.SaveChangesAsync();
            await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
            await transaction.CommitAsync();
        }

        public async Task<bool> IsOrderOnlinePaidAsync(int orderId, int requesterUserId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            if (order.UserId != requesterUserId)
                throw new UnauthorizedAccessException("Bạn không có quyền xem trạng thái thanh toán đơn này.");
            return order.IsPaid;
        }

        public async Task<string> CreateVnPayUrlAsync(int orderId, string clientIpAddress, int requesterUserId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            EnsureOwnedPendingPayment(order, requesterUserId);

            var tmnCode = Environment.GetEnvironmentVariable("VNPAY_TMNCODE");
            var hashSecret = Environment.GetEnvironmentVariable("VNPAY_HASHSECRET");
            var vnpUrl = Environment.GetEnvironmentVariable("VNPAY_URL");
            var returnUrl = Environment.GetEnvironmentVariable("VNPAY_RETURNURL");

            if (string.IsNullOrEmpty(tmnCode) || string.IsNullOrEmpty(hashSecret)
                || string.IsNullOrEmpty(vnpUrl) || string.IsNullOrEmpty(returnUrl))
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
            public int Compare(string? x, string? y)
            {
                if (x == y) return 0;
                if (x == null) return -1;
                if (y == null) return 1;
                var vnpCompare = string.Compare(x, y, StringComparison.Ordinal);
                if (vnpCompare != 0) return vnpCompare;
                return string.Compare(x, y, StringComparison.Ordinal);
            }
        }

        public async Task<string> CreateSePayUrlAsync(int orderId, int requesterUserId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}");
            }
            EnsureOwnedPendingPayment(order, requesterUserId);
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SEPAY_URL")))
                throw new InvalidOperationException("Chưa cấu hình cổng thanh toán SePay.");

            var sepayBaseUrl = Environment.GetEnvironmentVariable("SEPAY_URL"); 
            var amount = (long)order.FinalAmount;
            var memo = $"AB{order.Id}";

            var paymentUrl = $"{sepayBaseUrl}&amount={amount}&des={memo}";
            
            order.PayUrl = paymentUrl;
            order.PaymentMethod = "SePay";
            await _orderRepository.UpdateAsync(order);

            return paymentUrl;
        }

        public async Task HandleSePayIpnAsync(JsonElement ipnData, string? authorizationHeader)
        {
            var webhookKey = Environment.GetEnvironmentVariable("SEPAY_WEBHOOK_API_KEY");
            if (string.IsNullOrWhiteSpace(webhookKey))
                throw new InvalidOperationException("Chưa cấu hình khóa xác thực webhook SePay.");
            if (!SecureEquals($"Apikey {webhookKey}", authorizationHeader?.Trim() ?? string.Empty))
                throw new UnauthorizedAccessException("Xác thực webhook SePay không hợp lệ.");

            if (!string.Equals(JsonText(ipnData, "transferType"), "in", StringComparison.OrdinalIgnoreCase)
                || !decimal.TryParse(JsonText(ipnData, "transferAmount"), NumberStyles.Number,
                    CultureInfo.InvariantCulture, out var transferAmount))
                throw new InvalidOperationException("Webhook SePay không phải giao dịch tiền vào hợp lệ.");
            var content = JsonText(ipnData, "content").ToUpperInvariant();
            var match = System.Text.RegularExpressions.Regex.Match(content, @"\bAB(\d+)\b");
            if (!match.Success || !int.TryParse(match.Groups[1].Value, out var orderId))
                throw new InvalidOperationException("Không tìm thấy mã đơn hợp lệ trong webhook SePay.");

            var configuredAccount = Environment.GetEnvironmentVariable("SEPAY_ACCOUNT_NUMBER");
            if (!string.IsNullOrWhiteSpace(configuredAccount)
                && ipnData.TryGetProperty("accountNumber", out var accountValue)
                && !SecureEquals(configuredAccount, accountValue.GetString() ?? string.Empty))
                throw new UnauthorizedAccessException("Webhook SePay không thuộc tài khoản nhận tiền đã cấu hình.");

            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_workflow, orderId);
            var order = await _workflow.Set<Order>().Include(item => item.OrderItems)
                .FirstOrDefaultAsync(item => item.Id == orderId)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng {orderId}.");
            if (!string.Equals(order.PaymentMethod, "SePay", StringComparison.OrdinalIgnoreCase)
                || transferAmount != order.FinalAmount)
                throw new InvalidOperationException("Số tiền hoặc phương thức SePay không khớp đơn hàng.");
            if (order.IsPaid)
            {
                await transaction.CommitAsync();
                return;
            }
            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Đơn không còn chờ thanh toán; cần đối soát thủ công giao dịch đến muộn.");

            order.IsPaid = true;
            order.UpdatedBy = "SePay-IPN";
            var referenceCode = ipnData.TryGetProperty("referenceCode", out var reference)
                ? reference.GetString() : null;
            WorkflowSupport.Audit(_workflow, "OnlinePaymentConfirmed", "Order", order.Id,
                new { IsPaid = false },
                new { order.IsPaid, Method = "SePay", Amount = transferAmount, ReferenceCode = referenceCode });
            await _workflow.SaveChangesAsync();
            await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
            await transaction.CommitAsync();
        }

        public async Task<int> ReconcileUnpaidOnlineOrdersAsync(CancellationToken cancellationToken = default)
        {
            var unpaidOrders = await _workflow.Set<Order>().AsNoTracking()
                .Where(order => !order.IsPaid && order.Status == OrderStatus.Pending
                    && (order.PaymentMethod == "MoMo" || order.PaymentMethod == "SePay"))
                .OrderBy(order => order.OrderDate).Take(100).ToListAsync(cancellationToken);
            var reconciledCount = 0;

            foreach (var order in unpaidOrders)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var paid = false;
                try
                {
                    if (order.PaymentMethod == "MoMo" && !string.IsNullOrWhiteSpace(order.MoMoRequestId))
                        paid = (await QueryMoMoPaymentStatusAsync(order.Id)).IsPaid;
                    else if (order.PaymentMethod == "SePay")
                        paid = await VerifySePayTransactionAsync(order, cancellationToken);
                    if (paid) reconciledCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Không thể đối soát thanh toán tự động cho đơn hàng #{OrderId} ({Method}).",
                        order.Id, order.PaymentMethod);
                }

                if (!paid && IsPaymentExpired(order))
                {
                    try { await ExpireUnpaidOnlineOrderAsync(order.Id); }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Không thể hết hạn thanh toán đơn hàng #{OrderId}.", order.Id);
                    }
                }
            }
            return reconciledCount;
        }

        private async Task<bool> VerifySePayTransactionAsync(Order order, CancellationToken cancellationToken)
        {
            var apiToken = Environment.GetEnvironmentVariable("SEPAY_API_KEY");
            var accountNumber = Environment.GetEnvironmentVariable("SEPAY_ACCOUNT_NUMBER");
            if (string.IsNullOrWhiteSpace(apiToken)) return false;
            var baseUrl = Environment.GetEnvironmentVariable("SEPAY_TRANSACTIONS_URL")
                ?? "https://userapi-sandbox.sepay.vn/v2/transactions";
            var url = string.IsNullOrWhiteSpace(accountNumber)
                ? $"{baseUrl}?limit=50"
                : $"{baseUrl}?account_number={Uri.EscapeDataString(accountNumber)}&limit=50";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiToken);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return false;

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            if (!document.RootElement.TryGetProperty("data", out var transactions)
                && !document.RootElement.TryGetProperty("transactions", out transactions)) return false;
            if (transactions.ValueKind != JsonValueKind.Array) return false;
            var expectedCode = $"AB{order.Id}";
            var codeRegex = new System.Text.RegularExpressions.Regex(
                $@"\bAB{order.Id}\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            foreach (var item in transactions.EnumerateArray())
            {
                var transferType = item.TryGetProperty("transfer_type", out var typeValue)
                    ? typeValue.GetString() : string.Empty;
                if (!string.Equals(transferType, "in", StringComparison.OrdinalIgnoreCase)) continue;
                var code = item.TryGetProperty("code", out var codeValue)
                    ? codeValue.GetString()?.Trim() ?? string.Empty : string.Empty;
                var content = item.TryGetProperty("transaction_content", out var contentValue)
                    ? contentValue.GetString() ?? string.Empty : string.Empty;
                if (!string.Equals(code, expectedCode, StringComparison.OrdinalIgnoreCase)
                    && !codeRegex.IsMatch(content)) continue;

                decimal amountIn = 0;
                if (item.TryGetProperty("amount_in", out var amountValue))
                {
                    if (amountValue.ValueKind == JsonValueKind.Number) amountIn = amountValue.GetDecimal();
                    else decimal.TryParse(amountValue.GetString(), NumberStyles.Number,
                        CultureInfo.InvariantCulture, out amountIn);
                }
                if (amountIn == order.FinalAmount
                    && await ConfirmReconciledPaymentAsync(order.Id, "SePay", amountIn)) return true;
            }
            return false;
        }

        private async Task<bool> ConfirmReconciledPaymentAsync(int orderId, string method, decimal amount)
        {
            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_workflow, orderId);
            var order = await _workflow.Set<Order>().Include(item => item.OrderItems)
                .FirstOrDefaultAsync(item => item.Id == orderId);
            if (order == null || order.IsPaid)
            {
                await transaction.CommitAsync();
                return order?.IsPaid == true;
            }
            if (order.Status != OrderStatus.Pending
                || !string.Equals(order.PaymentMethod, method, StringComparison.OrdinalIgnoreCase)
                || order.FinalAmount != amount)
            {
                await transaction.CommitAsync();
                return false;
            }
            order.IsPaid = true;
            order.UpdatedBy = method + "-Reconciliation";
            WorkflowSupport.Audit(_workflow, "OnlinePaymentReconciled", "Order", order.Id,
                new { IsPaid = false }, new { order.IsPaid, Method = method, Amount = amount });
            await _workflow.SaveChangesAsync();
            await _loyalty.ProcessPaidDigitalOrderAsync(order.Id);
            await transaction.CommitAsync();
            return true;
        }

        private async Task<bool> ExpireUnpaidOnlineOrderAsync(int orderId)
        {
            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_workflow, orderId);
            var order = await _workflow.Set<Order>().Include(item => item.OrderItems)
                .FirstOrDefaultAsync(item => item.Id == orderId);
            if (order == null || order.IsPaid || order.Status != OrderStatus.Pending
                || !IsPaymentExpired(order)
                || order.PaymentMethod is not ("MoMo" or "SePay"))
            {
                await transaction.CommitAsync();
                return false;
            }

            var previous = order.Status;
            order.Status = OrderStatus.Failed;
            order.PayUrl = null;
            order.UpdatedBy = "PaymentTimeout";
            foreach (var item in order.OrderItems.Where(item => item.PurchaseType == PurchaseType.Physical))
                await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
            WorkflowSupport.StatusHistory(_workflow, order, previous, "System",
                "Hết thời hạn thanh toán online 15 phút.");
            WorkflowSupport.Audit(_workflow, "OnlinePaymentExpired", "Order", order.Id,
                new { Status = previous, order.IsPaid }, new { order.Status, order.IsPaid },
                details: "Tự động hủy sau 15 phút, hoàn kho và hoàn F-Point đã dùng.");
            WorkflowSupport.Notify(_workflow,
                $"Đơn #{order.Id} đã tự hủy do quá 15 phút chưa thanh toán. F-Point đã dùng được hoàn lại.",
                order.Id, order.UserId);
            await _workflow.SaveChangesAsync();
            await _loyalty.ReconcileOrderPointsAsync(order.Id);
            await transaction.CommitAsync();
            return true;
        }
    }
}
