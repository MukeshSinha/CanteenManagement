using CanteenManagement.Models;
using CanteenManagement.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace CanteenManagement.Controllers
{
    [Route("api/ItemMaster")]
    [ApiController]
    public class ItemMasterController : ControllerBase
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public ItemMasterController(IHeaderService headerService)
        {
            _headers = headerService;

        }

        // Get Item Master
        [HttpGet("getItemMaster")]
        public async Task<IActionResult> getItemMaster(string ?itemCode=null)
        {
            string url = ApiService.Canteen + $"Masters/Items/List?itemcode={itemCode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null);
            return Content(response, "application/json");
        }

        // Save Item Master
        [HttpPost("SaveItemMaster")]
        public async Task<IActionResult> SaveItemMaster([FromBody]ItemRequest itemRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string url = ApiService.Canteen + "Masters/Items/Add";
            string postData = JsonConvert.SerializeObject(itemRequest);
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);

            return Ok(response);
        }

        // Update Item Master
        [HttpPost("UpdateItemMaster")]
        public async Task<IActionResult> UpdateItemMaster([FromBody] ItemRequest itemRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string url = ApiService.Canteen + "/Masters/Items/Add";
            string postData = JsonConvert.SerializeObject(itemRequest);
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);

            return Ok(response);
        }
    }
}
