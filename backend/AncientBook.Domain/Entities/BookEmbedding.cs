using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Lưu trữ các đoạn trích văn bản và vector phục vụ RAG cho AI Copilot
    public class BookEmbedding : BaseEntity
    {
        // ID ấn bản E-Book sở hữu đoạn trích này
        public int EditionId { get; set; }

        // Số trang của đoạn trích (dùng để trích dẫn nguồn khi AI trả lời người đọc)
        public int? PageNumber { get; set; }

        // Thứ tự của khối văn bản trong tác phẩm
        public int ChunkIndex { get; set; }

        // Nội dung văn bản thuần túy đã được lọc rác (khoảng 300 - 500 từ)
        public string ChunkContent { get; set; } = string.Empty;

        // Chuỗi JSON biểu diễn mảng 768 số thực lưu trong SQL Server (NVARCHAR(MAX))
        public string EmbeddingJson { get; set; } = string.Empty;

        // Thuộc tính tiện ích dùng để tính toán trong code C#, không tạo cột trong Database
        [NotMapped]
        public float[] Vector
        {
            get => string.IsNullOrEmpty(EmbeddingJson)
                ? Array.Empty<float>()
                : JsonSerializer.Deserialize<float[]>(EmbeddingJson) ?? Array.Empty<float>();
            set => EmbeddingJson = JsonSerializer.Serialize(value);
        }

        // --- Navigation Properties ---

        // Ấn bản E-Book sở hữu
        public EbookEdition? Edition { get; set; }
    }
}