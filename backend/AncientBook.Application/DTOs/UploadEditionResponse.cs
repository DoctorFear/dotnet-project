using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.Common.Models.Responses
{


    public class PublishEditionRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn cấu hình Preset.")]
        [Range(1, 3, ErrorMessage = "PresetId không hợp lệ (chỉ nhận từ 1 đến 3).")]
        public int PresetId { get; set; }
    }

    public class SaveDraftRequest
    {
        public int PresetId { get; set; }
    }

    public class CopilotQueryRequest
    {
        public string Question { get; set; } = string.Empty;
    }
}