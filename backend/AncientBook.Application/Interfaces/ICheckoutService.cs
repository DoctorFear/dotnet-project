using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using System.Text.Json;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces
{
    public interface ICheckoutService
    {
        Task<CreateCheckoutResponse> ProcessCheckoutAsync(CreateCheckoutRequest request);
        Task<CreateMomoResponse> CreatePaymentUrlAsync(int orderId, int requesterUserId);
        Task HandleMoMoIpnAsync(JsonElement ipnData);
        Task<GetMomoResponse> QueryMoMoPaymentStatusAsync(int orderId, int? requesterUserId = null);
        Task<bool> IsOrderOnlinePaidAsync(int orderId, int requesterUserId);
        Task<string> CreateVnPayUrlAsync(int orderId, string clientIpAddress, int requesterUserId);
        Task<string> CreateSePayUrlAsync(int orderId, int requesterUserId);
        Task HandleSePayIpnAsync(JsonElement ipnData, string? authorizationHeader);
        Task<int> ReconcileUnpaidOnlineOrdersAsync(CancellationToken cancellationToken = default);
    }
}