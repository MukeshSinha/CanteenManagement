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

        [HttpGet("get-employee-raw-punch")]
        public async Task<IActionResult> getEmployeeRawPunch(
            [FromQuery] string? fordate = null,
            [FromQuery] string? category = null
            )
        {
            string url = ApiService.Canteen + "CanteenPunch/getEmpRawpunch";
            var queryParams = new List<string>();

            if (fordate != null)
            {
                queryParams.Add($"fordate={fordate}");
            }
            if (category != null)
            {
                queryParams.Add($"category={category}");
            }

            if (queryParams.Count > 0)
            {
                url += "?" + string.Join("&", queryParams);
            }

            //string url = ApiService.Canteen + $"CanteenPunch/EmployeeRawPunch?fordate={fordate}&category={category}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        [HttpGet("get-user-dashboard")]
        public async Task<IActionResult> getUserDashboard()
        {
            string url = ApiService.Canteen + $"CanteenPunch/CanteenDashboard";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

    }
}
