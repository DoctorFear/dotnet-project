using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    // Ấn bản điện tử số hóa cụ thể của một đầu sách (Quan hệ 1-N với Book)
    public class EbookEdition : BaseEntity
    {
        // ID đầu sách liên kết
        public int BookId { get; set; }

        // Tên tệp gốc khi tải lên (VD: "giao-trinh-toan-cao-cap.pdf")
        public string FileTitle { get; set; } = string.Empty;

        // Định dạng tệp sách số (Epub = 1, Pdf = 2)
        public EbookFormat Format { get; set; }

        // Đường dẫn lưu trữ tệp an toàn trên Dropbox Cloud Storage
        public string DropboxPath { get; set; } = string.Empty;

        // Dung lượng tệp tính theo đơn vị Bytes
        public long FileSizeBytes { get; set; }

        // Tổng số trang (nếu là PDF) hoặc tổng số chương mục (nếu là EPUB)
        public int TotalPages { get; set; }

        // ID nhóm cấu hình trải nghiệm đọc (Preset 1, 2 hoặc 3)
        public EbookPresetType PresetType { get; set; }

        // Trạng thái xuất bản (Draft = 0, Processing = 1, Published = 2, Failed = 3)
        public EditionPublishStatus Status { get; set; } = EditionPublishStatus.Draft;

        // Thời điểm ấn bản chính thức được phát hành công khai đến độc giả
        public DateTime? PublishedAt { get; set; }

        // --- Navigation Properties ---

        // Đầu sách sở hữu ấn bản này
        public Book? Book { get; set; }


        // Tập hợp các khối văn bản đã được vector hóa phục vụ RAG (dành cho Preset 1 & 2)
        public ICollection<BookEmbedding> Embeddings { get; set; } = new List<BookEmbedding>();


        public bool IsTtsEnabled { get; set; } = false;
    }
}