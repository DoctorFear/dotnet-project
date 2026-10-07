using AncientBook.Application.DTOs;
using AncientBook.Domain.Enums;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace AncientBook.Infrastructure.Services
{


    public class TtsDocumentExtractorService : ITtsDocumentExtractorService
    {
        private const int MinSegmentLength = 10; // Bỏ qua dòng tiêu đề phụ/rác quá ngắn

        public List<TtsSegmentDto> ExtractSegments(Stream fileStream, EbookPresetType presetType)
        {
            return presetType switch
            {
                EbookPresetType.EpubStandard => ExtractFromEpub(fileStream),
                EbookPresetType.PdfStandard => ExtractFromPdf(fileStream),
                _ => throw new NotSupportedException($"PresetType {presetType} không hỗ trợ trích xuất giọng đọc TTS.")
            };
        }

        // LOẠI 1: EPUB (Cứ xuống dòng / thẻ khối / <br> là 1 khối)
        private List<TtsSegmentDto> ExtractFromEpub(Stream fileStream)
        {
            var segments = new List<TtsSegmentDto>();
            var epubBook = VersOne.Epub.EpubReader.ReadBook(fileStream);

            int pageCounter = 1;

            foreach (var contentFile in epubBook.ReadingOrder)
            {
                if (string.IsNullOrWhiteSpace(contentFile.Content))
                {
                    pageCounter++;
                    continue;
                }

                var doc = new HtmlAgilityPack.HtmlDocument();
                doc.LoadHtml(contentFile.Content);

                // 1. Loại bỏ các thẻ không liên quan
                doc.DocumentNode.Descendants()
                    .Where(n => n.Name is "script" or "style" or "img" or "svg")
                    .ToList()
                    .ForEach(n => n.Remove());

                // 2. Thay thẻ <br> thành dấu xuống dòng thật để dễ tách
                var breakTags = doc.DocumentNode.SelectNodes("//br");
                if (breakTags != null)
                {
                    foreach (var br in breakTags)
                    {
                        br.ParentNode.ReplaceChild(doc.CreateTextNode("\n"), br);
                    }
                }

                // 3. Quét tất cả thẻ nội dung phổ biến
                var nodes = doc.DocumentNode.SelectNodes("//p | //blockquote | //h1 | //h2 | //h3 | //h4 | //li | //div");
                var linesInChapter = new List<string>();

                if (nodes != null && nodes.Count > 0)
                {
                    foreach (var node in nodes)
                    {
                        var rawNodeText = HtmlAgilityPack.HtmlEntity.DeEntitize(node.InnerText ?? "");
                        // Tách tiếp nếu trong 1 thẻ có dấu xuống dòng \n
                        var subLines = rawNodeText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var line in subLines)
                        {
                            var clean = Regex.Replace(line.Trim(), @"\s+", " ");
                            if (clean.Length >= MinSegmentLength)
                            {
                                linesInChapter.Add(clean);
                            }
                        }
                    }
                }
                else
                {
                    // Fallback nếu tài liệu không dùng thẻ cấu trúc chuẩn
                    var fullText = HtmlAgilityPack.HtmlEntity.DeEntitize(doc.DocumentNode.InnerText ?? "");
                    var allLines = fullText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in allLines)
                    {
                        var clean = Regex.Replace(line.Trim(), @"\s+", " ");
                        if (clean.Length >= MinSegmentLength)
                        {
                            linesInChapter.Add(clean);
                        }
                    }
                }

                // 4. Gán SegmentIndex cho từng dòng riêng biệt (Overlap = 0)
                int segmentCounter = 0;
                foreach (var line in linesInChapter)
                {
                    segments.Add(new TtsSegmentDto
                    {
                        PageNumber = pageCounter,
                        SegmentIndex = segmentCounter++,
                        TextContent = line
                    });
                }

                if (segmentCounter > 0)
                {
                    pageCounter++;
                }
            }

            return segments;
        }

        // LOẠI 2: PDF (Mỗi dòng / đoạn văn bản xuống dòng là 1 khối riêng)
        private List<TtsSegmentDto> ExtractFromPdf(Stream fileStream)
        {
            var segments = new List<TtsSegmentDto>();
            using var pdfDocument = PdfDocument.Open(fileStream);

            foreach (var page in pdfDocument.GetPages())
            {
                int pageNumber = page.Number;
                var pageHeight = page.Height;

                // Lọc bỏ 5% header đỉnh và 5% footer đáy (số trang, tiêu đề lặp lại)
                var words = page.GetWords()
                    .Where(w => w.BoundingBox.Bottom > pageHeight * 0.05 && w.BoundingBox.Top < pageHeight * 0.95)
                    .ToList();

                if (!words.Any()) continue;

                var pageText = ContentOrderTextExtractor.GetText(page);

                // Tách theo bất kỳ dấu xuống dòng nào (\r\n hoặc \n đơn lẻ)
                var rawLines = pageText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);

                int segmentCounter = 0;
                foreach (var line in rawLines)
                {
                    var cleanText = Regex.Replace(line.Trim(), @"\s+", " ");

                    // Bỏ qua dòng rác, số trang đơn lẻ hoặc ký tự linh tinh dưới 10 ký tự
                    if (cleanText.Length < MinSegmentLength) continue;

                    segments.Add(new TtsSegmentDto
                    {
                        PageNumber = pageNumber,
                        SegmentIndex = segmentCounter++,
                        TextContent = cleanText
                    });
                }
            }

            return segments;
        }
    }
}