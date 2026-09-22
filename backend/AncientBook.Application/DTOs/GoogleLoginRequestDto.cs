using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.DTOs.Auth
{
    public class GoogleLoginRequestDto
    {
        [Required(ErrorMessage = "Google ID Token không được để trống")]
        public string IdToken { get; set; } = null!;
    }
}