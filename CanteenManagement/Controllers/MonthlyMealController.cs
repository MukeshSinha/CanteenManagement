using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/Monthly-Meal")]
    [ApiController]
    public class MonthlyMealController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public MonthlyMealController(IHeaderService headers)
        {
            _headers = headers;
        }

        // Get Monthly Report

        [HttpGet("get-monthly-report")]
        public async Task<IActionResult> getMonthlyReport([FromQuery] string? fromdate = null, [FromQuery] string? uptodate = null, [FromQuery] string? category = null)
        {
            string url = ApiService.Canteen + $"CanteenPunch/MonthlyMeal?fromdate={fromdate}&uptodate={uptodate}&category={category}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        // Fetch the report for the department/Contractor wise

        [HttpGet("report-cont-deptWise")]
        public async Task<IActionResult> ReportContDeptWise([FromQuery] string? fromdate = null, [FromQuery] string? uptodate = null, [FromQuery] string? category = null)
        {
            string url = ApiService.Canteen + $"CanteenPunch/ContractorDeptWise?fromdate={fromdate}&uptodate={uptodate}&category={category}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }
    }
}
