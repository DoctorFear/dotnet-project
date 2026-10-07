public interface ITtsAudioService
{
    Task<byte[]> SynthesizeSpeechAsync(string text, string gender, string language = "vi", CancellationToken ct = default);
}