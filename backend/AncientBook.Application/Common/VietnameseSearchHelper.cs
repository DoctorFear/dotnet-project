using System.Globalization;
using System.Text;

namespace AncientBook.Application.Common
{
    public static class VietnameseSearchHelper
    {
        // Chuẩn hóa chuỗi tiếng Việt về dạng không dấu, viết thường và loại bỏ khoảng trắng thừa
        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            string decomposed = value.Trim().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(decomposed.Length);

            foreach (char ch in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder
                .ToString()
                .Normalize(NormalizationForm.FormC)
                .Replace('đ', 'd')
                .Replace('Đ', 'd')
                .ToLowerInvariant();
        }

        // Kiểm tra chuỗi nguồn có chứa từ khóa đã chuẩn hóa hay không
        public static bool ContainsNormalized(string? source, string normalizedKeyword)
        {
            if (string.IsNullOrEmpty(normalizedKeyword))
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(source))
            {
                return false;
            }

            return Normalize(source).Contains(normalizedKeyword, StringComparison.Ordinal);
        }

        // Kiểm tra từ khóa đã chuẩn hóa có khớp ít nhất một trường dữ liệu hay không
        public static bool MatchesAny(string normalizedKeyword, params string?[] fields)
        {
            if (string.IsNullOrEmpty(normalizedKeyword))
            {
                return true;
            }

            foreach (string? field in fields)
            {
                if (ContainsNormalized(field, normalizedKeyword))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
