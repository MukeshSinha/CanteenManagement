using static System.Runtime.InteropServices.JavaScript.JSType;

namespace CanteenManagement.Models
{
    public class ItemRequest
    {
        public int itemCode { get; set; }
        public string? itemName { get; set; }
        public int itemType { get; set; }
        public Rate? rate { get; set; }

    }
    public class Rate
    {
        public int irate { get; set; }
        public DateTime wefDate { get; set; }
    }
}
