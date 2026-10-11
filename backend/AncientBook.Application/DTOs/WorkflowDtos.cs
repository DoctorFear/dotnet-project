namespace AncientBook.Application.DTOs;

public record WorkflowNotificationDto(int Id, int? OrderId, string Message, DateTime CreatedAt);
public record BonusEbookDto(int BookId, string Title, int OrderId)
{
    public List<BonusEbookEditionDto> Editions { get; init; } = [];
}
public record BonusEbookEditionDto(int EditionId, string FileTitle, string Format, string ContentUrl);
// Dùng nội bộ để lấy file; không trả đường dẫn Dropbox trong response API.
public record BonusEbookContent(string DropboxPath, string ContentType);
public record LinkShipperAccountRequest(int UserId);
