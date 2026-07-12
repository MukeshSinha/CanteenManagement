using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/Canteen-Punch")]
    [ApiController]
    public class CanteenPunchController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CanteenPunchController(IHeaderService headerService)
        {
            _headers = headerService;
        }

        [HttpGet("get-todayLunch")]
        public async Task<IActionResult> getTodayLunch()
        {
            string url = ApiService.Canteen + $"CanteenPunch/GetTodayLunch";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        [HttpGet("get-todayDinner")]
        public async Task<IActionResult> getTodayDinner()
        {
            string url = ApiService.Canteen + $"CanteenPunch/GetTodayDinner";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }
    }
}
