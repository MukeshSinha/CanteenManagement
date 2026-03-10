namespace CanteenManagement.Services
{
    public interface IHeaderService
    {
        Dictionary<string, string> GetHeaders();
    }

    public class HeaderService : IHeaderService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HeaderService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Dictionary<string, string> GetHeaders()
        {
            var mheader = new Dictionary<string, string>
      {
            { "DatabaseName", "MaxCanteen" },
            { "UserID", "abc"},
            { "IpAddress", "123.456.789" },

      };

            return mheader;
        }
    }
}
