using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CanteenManagement.Controllers
{
    [Route("api/Login")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public LoginController(IHeaderService headerService)
        {
            _headers = headerService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserName))
            {
                return BadRequest(new { statusCode = 2, message = "UserName is required." });
            }

            string url = ApiService.Canteen + "UserManages/UserLogin";
            var mHeader = _headers.GetHeaders();

            // 1. Call UserLogin api with only username payload
            string loginPayload = JsonSerializer.Serialize(new
            {
                userName = request.UserName
            });

            try
            {
                string firstResponse = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, loginPayload);

                // If password is not provided, we just return the first response
                if (string.IsNullOrEmpty(request.Password))
                {
                    return Content(firstResponse, "application/json");
                }

                // If password is provided, check if first call has statusCode == 1
                int firstStatusCode = GetStatusCode(firstResponse);

                if (firstStatusCode == 1)
                {
                    // 2. Call again passing password payload value
                    string passwordPayload = JsonSerializer.Serialize(new
                    {
                        userName = request.UserName,
                        password = request.Password
                    });

                    string secondResponse = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, passwordPayload);
                    int secondStatusCode = GetStatusCode(secondResponse);

                    if (secondStatusCode == 1)
                    {
                        return Ok(new { statusCode = 1, message = "Login Successfully" });
                    }
                    else
                    {
                        return Ok(new { statusCode = 2, message = "Failed to Login" });
                    }
                }
                else
                {
                    return Ok(new { statusCode = 2, message = "Failed to Login" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { statusCode = 2, message = $"Error occurred: {ex.Message}" });
            }
        }

        private int GetStatusCode(string jsonResponse)
        {
            if (string.IsNullOrEmpty(jsonResponse)) return 0;
            try
            {
                using (JsonDocument doc = JsonDocument.Parse(jsonResponse))
                {
                    if (doc.RootElement.TryGetProperty("statusCode", out var statusProp))
                    {
                        if (statusProp.ValueKind == JsonValueKind.Number)
                        {
                            return statusProp.GetInt32();
                        }
                        if (statusProp.ValueKind == JsonValueKind.String && int.TryParse(statusProp.GetString(), out var parsed))
                        {
                            return parsed;
                        }
                    }
                }
            }
            catch
            {
                // Ignore json parse error
            }
            return 0;
        }
    }

    public class LoginRequest
    {
        public string UserName { get; set; }
        public string? Password { get; set; }
    }
}
