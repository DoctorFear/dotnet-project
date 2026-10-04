using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Domain.Enums;
using UglyToad.PdfPig;
using VersOne.Epub;

namespace AncientBook.Infrastructure.Services
{
    public class DocumentExtractorService : IDocumentExtractor
    {
        public async Task<(int TotalPages, long FileSize)> InspectMetadataAsync(Stream fileStream, EbookFormat format)
        {
            long size = fileStream.Length;
            int pages = 0;

            if (format == EbookFormat.Pdf)
            {
                fileStream.Position = 0;
                using var document = PdfDocument.Open(fileStream);
                pages = document.NumberOfPages;
            }
            else if (format == EbookFormat.Epub)
            {
                fileStream.Position = 0;
                var epub = await EpubReader.ReadBookAsync(fileStream);
                pages = epub.ReadingOrder.Count;
            }

            return (pages, size);
        }

        public async Task<List<(int? PageNum, string Content)>> ExtractRawPagesAsync(Stream fileStream, EbookFormat format, CancellationToken ct = default)
        {
            var rawPages = new List<(int? PageNum, string Content)>();

            if (format == EbookFormat.Pdf)
            {
                fileStream.Position = 0;
                using var document = PdfDocument.Open(fileStream);
                foreach (var page in document.GetPages())
                {
                    if (ct.IsCancellationRequested) break;
                    string pageText = page.Text ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(pageText))
                    {
                        rawPages.Add((page.Number, CleanText(pageText)));
                    }
                }
            }
            else if (format == EbookFormat.Epub)
            {
                fileStream.Position = 0;
                var epub = await EpubReader.ReadBookAsync(fileStream);
                int sectionNumber = 1;
                foreach (var textContent in epub.ReadingOrder)
                {
                    if (ct.IsCancellationRequested) break;
                    string cleanHtml = StripHtml(textContent.Content);
                    if (!string.IsNullOrWhiteSpace(cleanHtml))
                    {
                        rawPages.Add((sectionNumber++, CleanText(cleanHtml)));
                    }
                }
            }

            return rawPages;
        }

        private static string CleanText(string input) =>
            Regex.Replace(input.Replace("\r", " "), @"\s+", " ").Trim();

        private static string StripHtml(string html) =>
            Regex.Replace(html, "<.*?>", string.Empty);
    }
}