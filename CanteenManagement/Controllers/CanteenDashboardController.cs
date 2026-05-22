using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/Canteen-Dashboard")]
    [ApiController]
    public class CanteenDashboardController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CanteenDashboardController(IHeaderService headers)
        {
            _headers = headers;
        }

        // Get Admin Dashboard

        [HttpGet("get-admin-dashboard")]
        public async Task<IActionResult> getAdminDashboard()
        {
            string url = ApiService.Canteen + $"CanteenPunch/AdminDashboard";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

    }
}
