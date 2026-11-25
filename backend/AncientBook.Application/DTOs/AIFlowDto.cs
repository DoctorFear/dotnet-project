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

public class TtsSegmentDto
{
    public int PageNumber { get; set; }
    public int SegmentIndex { get; set; }
    public string TextContent { get; set; } = string.Empty;
}

public class PageTtsResponseDto
{
    public int Id { get; set; }
    public int SegmentIndex { get; set; }
    public int PageNumber { get; set; }
    public string TextContent { get; set; } = string.Empty;
    public string AudioUrlFemale { get; set; } = string.Empty;
    public string AudioUrlMale { get; set; } = string.Empty;
}

public class TtsGenerateResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalSegmentsGenerated { get; set; }
}   

public class EbookEditionDetailDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string FileTitle { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string DropboxPath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public int TotalPages { get; set; }
    public EbookPresetType PresetType { get; set; }
    public string PresetTypeName { get; set; } = string.Empty;
    public EditionPublishStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? PublishedAt { get; set; }
    public bool IsTtsEnabled { get; set; }
    public int TotalEmbeddings { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}


