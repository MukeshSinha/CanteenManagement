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

        // get Coupon
        [HttpGet("get-Coupon")]
        public async Task<IActionResult> getCoupon(
            [FromQuery] string? fromdate = null,
            [FromQuery] string? uptodate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? multicategory = null
            )
        {
            try
            {
                string url = ApiService.Canteen;
                if (!string.IsNullOrWhiteSpace(fromdate) || !string.IsNullOrWhiteSpace(uptodate))
                {
                    url += $"CanteenPunch/GetCopuns?fromdate={fromdate}&uptodate={uptodate}";
                    if (!string.IsNullOrWhiteSpace(category))
                    {
                        url += $"&category={category}";
                    }
                    if (!string.IsNullOrWhiteSpace(multicategory))
                    {
                        url += $"&multicategory={multicategory}";
                    }
                }
                else
                {
                    url += $"CanteenPunch/GetCopuns";
                }
                var mHeader = _headers.GetHeaders();
                var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
                return Content(response, "application/json");

            }
            catch (Exception ex)
            {

                throw ex;
            }
           
        }

        // get Tea Coupon
        [HttpGet("get-TeaCoupon")]
        public async Task<IActionResult> getTeaCoupon(
            [FromQuery] string? fromdate = null,
            [FromQuery] string? uptodate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? multicategory = null
            )
        {
            try
            {
                string url = ApiService.Canteen;
                if (!string.IsNullOrWhiteSpace(fromdate) || !string.IsNullOrWhiteSpace(uptodate))
                {
                    url += $"Coupon/getTeaCoupon?fromdate={fromdate}&uptodate={uptodate}";
                    if (!string.IsNullOrWhiteSpace(category))
                    {
                        url += $"&category={category}";
                    }
                    if (!string.IsNullOrWhiteSpace(multicategory))
                    {
                        url += $"&multicategory={multicategory}";
                    }
                }
                else
                {
                    url += $"Coupon/getTeaCoupon";
                }
                var mHeader = _headers.GetHeaders();
                var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
                return Content(response, "application/json");

            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        // get snaks coupon
        [HttpGet("get-snacksCoupon")]
        public async Task<IActionResult> getSnacksCoupon(
            [FromQuery] string? fromdate = null,
            [FromQuery] string? uptodate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? multicategory = null
            )
        {
            try
            {
                string url = ApiService.Canteen;
                if (!string.IsNullOrWhiteSpace(fromdate) || !string.IsNullOrWhiteSpace(uptodate))
                {
                    url += $"Coupon/getSnaksCoupon?fromdate={fromdate}&uptodate={uptodate}";
                    if (!string.IsNullOrWhiteSpace(category))
                    {
                        url += $"&category={category}";
                    }
                    if (!string.IsNullOrWhiteSpace(multicategory))
                    {
                        url += $"&multicategory={multicategory}";
                    }
                }
                else
                {
                    url += $"Coupon/getSnaksCoupon";
                }
                var mHeader = _headers.GetHeaders();
                var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
                return Content(response, "application/json");

            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        // get Bs Coupon
        
        [HttpGet("get-BsCoupon")]
        public async Task<IActionResult> getBsCoupon(
            [FromQuery] string? fromdate = null,
            [FromQuery] string? uptodate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? multicategory = null
            )
        {
            try
            {
                string url = ApiService.Canteen;
                if (!string.IsNullOrWhiteSpace(fromdate) || !string.IsNullOrWhiteSpace(uptodate))
                {
                    url += $"Coupon/getBSCoupon?fromdate={fromdate}&uptodate={uptodate}";
                    if (!string.IsNullOrWhiteSpace(category))
                    {
                        url += $"&category={category}";
                    }
                    if (!string.IsNullOrWhiteSpace(multicategory))
                    {
                        url += $"&multicategory={multicategory}";
                    }
                }
                else
                {
                    url += $"Coupon/getBSCoupon";
                }
                var mHeader = _headers.GetHeaders();
                var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
                return Content(response, "application/json");

            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        [HttpGet("dateWise-totalMeal")]
        public async Task<IActionResult> dateWiseTotalMeal(
            [FromQuery] string? fromdate = null,
            [FromQuery] string? uptodate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? multicategory = null
            )
        {
            try
            {
                string url = ApiService.Canteen;
                if (!string.IsNullOrWhiteSpace(fromdate) || !string.IsNullOrWhiteSpace(uptodate))
                {
                    url += $"CanteenPunch/DateWiseTotalMeal?Fromdate={fromdate}&uptodate={uptodate}";
                    
                }
                else
                {
                    url += $"CanteenPunch/DateWiseTotalMeal";
                }
                var mHeader = _headers.GetHeaders();
                var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
                return Content(response, "application/json");

            }
            catch (Exception ex)
            {

                throw ex;
            }

        }
    }
}
