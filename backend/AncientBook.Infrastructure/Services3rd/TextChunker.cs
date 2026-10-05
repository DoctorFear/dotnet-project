using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Models;
using Microsoft.Extensions.Configuration;

namespace AncientBook.Infrastructure.Services
{
    public class TextChunker : ITextChunker
    {
        private readonly int _chunkSize;
        private readonly int _chunkOverlap;
        private readonly int _minChunkSize;

        public TextChunker(IConfiguration configuration)
        {
            _chunkSize = configuration.GetValue<int>("RagSettings:ChunkSize", 450);
            _chunkOverlap = configuration.GetValue<int>("RagSettings:ChunkOverlap", 90);
            _minChunkSize = configuration.GetValue<int>("RagSettings:MinChunkSize", 100);
        }

        public List<DocumentChunk> ChunkText(List<(int? PageNum, string Content)> pages)
        {
            var result = new List<DocumentChunk>();
            int chunkIndex = 0;

            foreach (var page in pages)
            {
                if (string.IsNullOrWhiteSpace(page.Content)) continue;

                var sentences = SplitIntoSentences(page.Content);
                if (sentences.Count == 0) continue;

                var currentChunkWords = new List<string>();
                var currentChunkSentences = new List<string>();

                for (int i = 0; i < sentences.Count; i++)
                {
                    var sentence = sentences[i];
                    var sentenceWords = sentence.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                    if (currentChunkWords.Count + sentenceWords.Length > _chunkSize && currentChunkWords.Count >= _minChunkSize)
                    {
                        string chunkText = string.Join(" ", currentChunkWords);
                        result.Add(new DocumentChunk(page.PageNum, chunkIndex++, chunkText));

                        var overlapWords = new List<string>();
                        var overlapSentences = new List<string>();

                        for (int j = currentChunkSentences.Count - 1; j >= 0; j--)
                        {
                            var wordsInSentence = currentChunkSentences[j].Split(' ', StringSplitOptions.RemoveEmptyEntries);
                            if (overlapWords.Count + wordsInSentence.Length <= _chunkOverlap)
                            {
                                overlapWords.InsertRange(0, wordsInSentence);
                                overlapSentences.Insert(0, currentChunkSentences[j]);
                            }
                            else
                            {
                                break;
                            }
                        }

                        currentChunkWords = new List<string>(overlapWords);
                        currentChunkSentences = new List<string>(overlapSentences);
                    }

                    currentChunkWords.AddRange(sentenceWords);
                    currentChunkSentences.Add(sentence);
                }

                if (currentChunkWords.Count > 0)
                {
                    string finalChunkText = string.Join(" ", currentChunkWords);
                    result.Add(new DocumentChunk(page.PageNum, chunkIndex++, finalChunkText));
                }
            }

            return result;
        }

        private static List<string> SplitIntoSentences(string text)
        {
            // Phân tách dấu câu (. ! ?) có khoảng trắng theo sau và bắt đầu từ viết hoa/số
            string pattern = @"(?<=[\.!\?])\s+(?=[A-ZÀ-Ỹ0-9])";
            return Regex.Split(text, pattern)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList();
        }
    }
}