namespace CanteenManagement
{
    public class ApiService
    {
        private static readonly HttpClient client = new HttpClient();
       
        public static string Canteen = "http://sprlhrd.shrirampistons.com:8080/canteen/api/";
        public static string Master = "http://sprlhrd.shrirampistons.com:8080/canteen/api/Masters/";
        public async Task<string> SendRequestAsync(
            string url,
            HttpMethod method,
            Dictionary<string, string> headers = null,
            Dictionary<string, string> parameters = null,
            string content = null,
            MultipartFormDataContent multipartContent = null
            )
        {
            try
            {

                HttpRequestMessage requestMessage = new HttpRequestMessage(method, url);


                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        requestMessage.Headers.Add(header.Key, header.Value);
                    }
                }
                if (parameters != null && (method == HttpMethod.Get || method == HttpMethod.Delete))
                {
                    var query = new FormUrlEncodedContent(parameters).ReadAsStringAsync().Result;
                    requestMessage.RequestUri = new Uri($"{url}?{query}");
                }

                else if (parameters != null && (method == HttpMethod.Post || method == HttpMethod.Put))
                {
                    requestMessage.Content = new FormUrlEncodedContent(parameters);
                }
                else if (content != null)
                {
                    requestMessage.Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json");
                }

                HttpResponseMessage response = await client.SendAsync(requestMessage);
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (HttpRequestException e)
            {
                return $"Error: {e.Message}";
            }
        }

        public async Task<byte[]> SendRequestAsync1(
           string url,
           HttpMethod method,
           Dictionary<string, string> headers = null,
           Dictionary<string, string> parameters = null,
           string content = null,
           MultipartFormDataContent multipartContent = null
           )
        {
            try
            {

                HttpRequestMessage requestMessage = new HttpRequestMessage(method, url);


                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        requestMessage.Headers.Add(header.Key, header.Value);
                    }
                }
                if (parameters != null && (method == HttpMethod.Get || method == HttpMethod.Delete))
                {
                    var query = new FormUrlEncodedContent(parameters).ReadAsStringAsync().Result;
                    requestMessage.RequestUri = new Uri($"{url}?{query}");
                }

                else if (parameters != null && (method == HttpMethod.Post || method == HttpMethod.Put))
                {
                    requestMessage.Content = new FormUrlEncodedContent(parameters);
                }
                else if (content != null)
                {
                    requestMessage.Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json");
                }

                HttpResponseMessage response = await client.SendAsync(requestMessage);
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (HttpRequestException e)
            {
                return null;
            }
        }

    }
}
