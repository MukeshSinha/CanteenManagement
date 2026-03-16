namespace CanteenManagement.Models
{
    public class FreeMealUploadRequest
    {
        public int mm { get; set; }
        public int yy { get; set; }
        public List<EmployeeItem>? listofEmployee { get; set; }
    }
    public class EmployeeItem
    {
        public string? empcode { get; set; }
        public int nos { get; set; }
    }
}
