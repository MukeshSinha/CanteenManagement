using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/ShitWise")]
    [ApiController]
    public class ShitWiseController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public ShitWiseController(IHeaderService headerService)
        {
            _headers = headerService;
        }

        [HttpGet("ShitWise-Data")]
        public async Task<IActionResult> ShitWiseData(string? fromdate = null, string? uptodate = null,string? contractor=null,string? category=null)
        {
            string url = ApiService.Canteen + $"CanteenPunch?fromdate={fromdate}&uptodate={uptodate}&contractor={contractor}&category={category}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        [HttpGet("Contractor-Report")]
        public async Task<IActionResult> ContractorReport()
        {
            string url = ApiService.Master + $"getContractor";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        [HttpGet("DateWise-Report")]
        public async Task<IActionResult> DateWiseReport(string? fromdate = null, string? uptodate = null)
        {
            string url = ApiService.Canteen + $"CanteenPunch?fromdate={fromdate}&uptodate={uptodate}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }

        [HttpGet("Contractor-Category")]
        public async Task<IActionResult> ContractorCategory(string? fromdate = null, string? uptodate = null)
        {
            string url = ApiService.Canteen + $"CanteenPunch/ContractorCategory?fromdate={fromdate}&uptodate={uptodate}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }
    }

    
}
