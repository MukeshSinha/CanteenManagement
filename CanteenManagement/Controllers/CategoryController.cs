using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.Controllers
{
    [Route("api/Category")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CategoryController(IHeaderService headerService)
        {
            _headers = headerService;
        }

        [HttpGet("get-category")]
        public async Task<IActionResult> getCategory()
        {
            string url = ApiService.Canteen + $"Masters/getEmpCategory";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            return Content(response, "application/json");
        }
    }
}
