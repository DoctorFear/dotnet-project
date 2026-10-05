using AncientBook.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
public class UploadEditionRequest
{
    [Required(ErrorMessage = "Mã sách không được để trống.")]
    public int BookId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn tệp sách.")]
    public IFormFile File { get; set; } = null!;
}

public class UploadEditionResponse
{
    public int EditionId { get; set; }
    public int BookId { get; set; }
    public string FileTitle { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public int TotalPages { get; set; }
    public long FileSizeBytes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string SuggestedPresetType { get; set; } = string.Empty;
}


public class SaveDraftRequest
{
    [Required(ErrorMessage = "Vui lòng chọn loại cấu hình preset.")]
    public EbookPresetType PresetType { get; set; }
}

public class PublishEditionRequest
{
    [Required(ErrorMessage = "Vui lòng chọn loại cấu hình preset.")]
    public EbookPresetType PresetType { get; set; }
}

public class CopilotQueryRequest
{
    [Required(ErrorMessage = "Câu hỏi không được để trống.")]
    public string Question { get; set; } = string.Empty;

    // Vùng bôi đen của người dùng (tùy chọn)
    public string? SelectedText { get; set; }

    // Trang sách hiện tại trên E-Reader (tùy chọn)
    public int? CurrentPage { get; set; }
}

public class CopilotQueryResponse
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public int TotalMatches { get; set; }
    public List<BookEmbeddingCitationDto> Citations { get; set; } = new();
}

public class BookEmbeddingCitationDto
{
    public int PageNumber { get; set; }
    public int ChunkIndex { get; set; }
    public string ChunkContent { get; set; } = string.Empty;
}

public class CopilotHistoryItemDto
{
    public int Id { get; set; }
    public int? CurrentPage { get; set; }
    public string? SelectedText { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}