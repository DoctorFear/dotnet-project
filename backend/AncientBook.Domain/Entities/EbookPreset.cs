using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Bảng cấu hình các nhóm trải nghiệm đọc sách số hóa (Preset 1, Preset 2, Preset 3)
    public class EbookPreset : BaseEntity
    {
        // Tên nhóm cấu hình (VD: "Văn học / Tiểu thuyết", "Học thuật / Giáo trình", "Tư liệu scan / Manga")
        public string Name { get; set; } = string.Empty;

        // Mô tả chi tiết mục đích sử dụng của nhóm
        public string Description { get; set; } = string.Empty;

        // Cờ kích hoạt Trợ lý giải nghĩa ngữ cảnh Copilot (Preset 1 & 2: True, Preset 3: False)
        public bool EnableAiAssistant { get; set; } = false;

        // Cờ kích hoạt Giọng đọc số tự động TTS (Chỉ Preset 1: True)
        public bool EnableAiVoice { get; set; } = false;

        // Chế độ dàn trang hiển thị trên Web E-Reader (VD: "SinglePageReflow", "FixedVector", "SpreadScan")
        public string ReaderLayoutMode { get; set; } = "SinglePageReflow";

        // --- Navigation Properties ---

        // Danh sách các ấn bản sách đang áp dụng nhóm cấu hình này
        public ICollection<EbookEdition> Editions { get; set; } = new List<EbookEdition>();
    }
}