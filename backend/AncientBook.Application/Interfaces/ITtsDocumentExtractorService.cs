using AncientBook.Domain.Enums;

public interface ITtsDocumentExtractorService
{
    List<TtsSegmentDto> ExtractSegments(Stream fileStream, EbookPresetType presetType);
}