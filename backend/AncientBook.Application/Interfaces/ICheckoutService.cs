using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using System.Text.Json;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces
{
    public interface ICheckoutService
    {
        Task<CreateCheckoutResponse> ProcessCheckoutAsync(CreateCheckoutRequest request);
        Task<CreateMomoResponse> CreatePaymentUrlAsync(int orderId);
        Task HandleMoMoIpnAsync(JsonElement ipnData);
        Task<GetMomoResponse> QueryMoMoPaymentStatusAsync(int orderId);
    }
}