using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/test")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet("GetData")]
        public IActionResult GetData()
        {
            return Ok(new
            {
                message = "API working successfully reload data 🚀",
                serverTime = DateTime.Now,
                version = "1.0"
            });
        }
    }
}
