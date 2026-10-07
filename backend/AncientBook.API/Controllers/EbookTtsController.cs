using System.Threading;
using System.Threading.Tasks;
using AncientBook.Infrastructure.Services; // Namespace chứa IEbookTtsService
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/EbookEditions/{editionId}/tts")]
    public class EbookTtsController : ControllerBase
    {
        private readonly IEbookTtsService _ttsService;

        public EbookTtsController(IEbookTtsService ttsService)
        {
            _ttsService = ttsService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateTts(
            int editionId,
            [FromQuery] string language = "vi",
            CancellationToken ct = default)
        {
            var result = await _ttsService.GenerateTtsAsync(editionId, language, ct);
            return Ok(result);
        }

        [HttpGet("pages/{pageNumber}/segments")]
        public async Task<IActionResult> GetPageSegments(
            int editionId,
            int pageNumber,
            CancellationToken ct = default)
        {
            var segments = await _ttsService.GetPageSegmentsAsync(editionId, pageNumber, ct);
            return Ok(segments);
        }
    }
}