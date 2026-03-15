using CanteenManagement.Models;
using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace CanteenManagement.Controllers
{
    [Route("api/UploadMeal")]
    [ApiController]
    public class UploadMealController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public UploadMealController(IHeaderService headerService)
        {
            _headers = headerService;

        }

        [HttpPost("UploadMealData")]
        public async Task<IActionResult> UploadMealData([FromBody]FreeMealUploadRequest freeMealUploadRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string url= ApiService.Canteen + "Upload/UploadFreeMeal";
            string postData = JsonConvert.SerializeObject(freeMealUploadRequest);
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);

            return Ok(response);
        }
    }
}
