using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Repositories;

namespace AncientBook.Application.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IBookRepository _bookRepository;

        public CartService(ICartRepository cartRepository, IBookRepository bookRepository)
        {
            _cartRepository = cartRepository;
            _bookRepository = bookRepository;
        }

        public async Task AddItemToCartAsync(AddToCartRequest request)
        {
            var book = await _bookRepository.GetByIdAsync(request.BookId);
            if (book == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy sách với ID: {request.BookId}");
            }

            if (request.PurchaseType == PurchaseType.Physical)
            {
                if (!book.IsPhysicalAvailable)
                {
                    throw new InvalidOperationException($"Sách '{book.Title}' không hỗ trợ mua bản vật lý.");
                }
                if (request.Quantity < 1) request.Quantity = 1;
            }
            else if (request.PurchaseType == PurchaseType.Rental)
            {
                if (!book.IsRentalAvailable)
                {
                    throw new InvalidOperationException($"Sách '{book.Title}' không hỗ trợ cho thuê online.");
                }
                if (!request.RentalDuration.HasValue)
                {
                    throw new ArgumentException("Vui lòng chọn gói thời gian thuê (Weekly, Monthly, Yearly).");
                }
                request.Quantity = 1; 
            }

            var cart = await _cartRepository.GetByUserIdAsync(request.UserId);
            if (cart == null)
            {
                cart = new Cart { UserId = request.UserId };
                await _cartRepository.AddAsync(cart);
            }

            var existingItem = await _cartRepository.GetCartItemAsync(cart.Id, request.BookId, request.PurchaseType);

            if (existingItem != null)
            {
                if (request.PurchaseType == PurchaseType.Physical)
                {
                    existingItem.Quantity += request.Quantity;
                }
                else
                {
                    existingItem.RentalDuration = request.RentalDuration;
                }
                await _cartRepository.UpdateItemAsync(existingItem);
            }
            else
            {
                var newItem = new CartItem
                {
                    CartId = cart.Id,
                    BookId = request.BookId,
                    Quantity = request.Quantity,
                    PurchaseType = request.PurchaseType,
                    RentalDuration = request.RentalDuration
                };
                await _cartRepository.AddItemAsync(newItem);
            }
        }

        public async Task<CartResponseDto> GetCartAsync(int userId)
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null)
            {
                return new CartResponseDto { CartId = 0, Items = new(), TotalAmount = 0 };
            }

            var itemDtos = new List<CartItemResponseDto>();
            decimal grandTotal = 0;

            foreach (var ci in cart.CartItems)
            {
                if (ci.Book == null) continue;

                decimal unitPrice = 0;
                if (ci.PurchaseType == PurchaseType.Physical)
                {
                    unitPrice = ci.Book.PhysicalPrice; //[cite: 7]
                }
                else if (ci.PurchaseType == PurchaseType.Rental)
                {
                    unitPrice = ci.RentalDuration switch
                    {
                        RentalDurationType.Weekly => ci.Book.WeeklyRentalPrice,   //[cite: 7]
                        RentalDurationType.Monthly => ci.Book.MonthlyRentalPrice, //[cite: 7]
                        RentalDurationType.Yearly => ci.Book.YearlyRentalPrice,   //[cite: 7]
                        _ => 0
                    };
                }

                decimal itemTotal = unitPrice * ci.Quantity;
                grandTotal += itemTotal;

                itemDtos.Add(new CartItemResponseDto
                {
                    CartItemId = ci.Id,
                    BookId = ci.BookId,
                    Title = ci.Book.Title,
                    Author = ci.Book.Author,
                    CoverImg = ci.Book.CoverImg,
                    PurchaseType = ci.PurchaseType,
                    Quantity = ci.Quantity,
                    RentalDuration = ci.RentalDuration,
                    UnitPrice = unitPrice
                });
            }

            return new CartResponseDto
            {
                CartId = cart.Id,
                Items = itemDtos,
                TotalAmount = grandTotal
            };
        }

        public async Task RemoveCartItemAsync(int userId, int cartItemId)
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null) throw new KeyNotFoundException("Không tìm thấy giỏ hàng của người dùng.");

            var cartItem = await _cartRepository.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null || cartItem.CartId != cart.Id)
            {
                throw new KeyNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng.");
            }

            await _cartRepository.RemoveItemAsync(cartItem);
        }

        public async Task UpdateCartItemAsync(int userId, int cartItemId, UpdateCartItemRequest request)
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null) throw new KeyNotFoundException("Không tìm thấy giỏ hàng.");

            var cartItem = await _cartRepository.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null || cartItem.CartId != cart.Id)
            {
                throw new KeyNotFoundException("Không tìm thấy sản phẩm cần cập nhật.");
            }

            var book = cartItem.Book ?? await _bookRepository.GetByIdAsync(cartItem.BookId);
            if (book == null) throw new KeyNotFoundException("Không tìm thấy thông tin sách.");

            if (request.PurchaseType == PurchaseType.Physical)
            {
                if (!book.IsPhysicalAvailable) throw new InvalidOperationException("Sách này không hỗ trợ mua bản vật lý."); //[cite: 7]
                if (request.Quantity < 1) request.Quantity = 1;
            }
            else if (request.PurchaseType == PurchaseType.Rental)
            {
                if (!book.IsRentalAvailable) throw new InvalidOperationException("Sách này không hỗ trợ cho thuê online."); //[cite: 7]
                if (!request.RentalDuration.HasValue) throw new ArgumentException("Vui lòng chọn thời gian thuê.");
                request.Quantity = 1;
            }

            if (cartItem.PurchaseType != request.PurchaseType)
            {
                var conflictingItem = await _cartRepository.GetCartItemAsync(cart.Id, cartItem.BookId, request.PurchaseType);
                if (conflictingItem != null)
                {
                    throw new InvalidOperationException("Sản phẩm với hình thức mua này đã có sẵn trong giỏ hàng. Vui lòng gộp hoặc xóa bớt.");
                }
            }

            cartItem.PurchaseType = request.PurchaseType;
            cartItem.Quantity = request.Quantity;
            cartItem.RentalDuration = request.RentalDuration;

            await _cartRepository.UpdateItemAsync(cartItem);
        }
    }
}