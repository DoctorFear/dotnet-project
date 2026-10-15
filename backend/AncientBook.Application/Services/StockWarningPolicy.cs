using System.Globalization;
using AncientBook.Application.Interfaces;

namespace AncientBook.Application.Services;

internal static class StockWarningPolicy
{
    public static async Task<int> GetThresholdAsync(ISystemSettingRepository settings)
    {
        var value = await settings.GetByKeyAsync("LOW_STOCK_THRESHOLD");
        return int.TryParse(value?.SettingValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var threshold) && threshold >= 0 ? threshold : 5;
    }

    public static string GetStatus(bool physical, int quantity, int threshold) =>
        !physical || quantity <= 0 ? "out_of_stock" : quantity <= threshold ? "low_stock" : "in_stock";
}
