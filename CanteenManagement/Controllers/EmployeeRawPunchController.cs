using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/Employee-RawPunch")]
    [ApiController]
    public class EmployeeRawPunchController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmployeeRawPunchController(IHeaderService headers)
        {
            _headers = headers;
        }

        // Get Employee Raw Punch

        [HttpGet("get-employee-raw-punch")]
        public async Task<IActionResult> getEmployeeRawPunch([FromQuery] string? fromdate = null, [FromQuery] string? uptodate = null, [FromQuery] string? empcode = null)
        {
            string url = ApiService.Canteen + $"CanteenPunch/getRawpunch?fromdate={fromdate}&uptodate={uptodate}&empcode={empcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        // Get Employee Punch Category Contractor

        [HttpGet("employee-punch-category-contractor")]
        public async Task<IActionResult> employeePunchCategoryContractor([FromQuery] string? fromdate = null, [FromQuery] string? uptodate = null, [FromQuery] string? contractor = null, [FromQuery] string? category = null)
        {
            string url = ApiService.Canteen +
            $"CanteenPunch/getRawpunch?fromdate={fromdate}&uptodate={uptodate}" +
            $"{(string.IsNullOrEmpty(contractor) ? "" : $"&contractor={contractor}")}" +
            $"{(string.IsNullOrEmpty(category) ? "" : $"&category={category}")}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

    }
}
