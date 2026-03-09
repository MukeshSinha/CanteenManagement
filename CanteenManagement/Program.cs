using CanteenManagement.BusinessLayer;
using CanteenManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddScoped<SessionManager>();

builder.Services.AddScoped<IHeaderService, HeaderService>();


builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();


var app = builder.Build();

app.UseHttpsRedirection();

// 1️ Static files FIRST
app.UseDefaultFiles();
app.UseStaticFiles();

// 2️⃣ Routing start
app.UseRouting();

app.UseAuthorization();

// 3️⃣ API endpoints
app.MapControllers();

// 4️⃣ SPA fallback LAST (very important)
app.MapFallbackToFile("/index.html");


app.Run();
