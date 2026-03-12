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

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;

    // ✅ Let controllers handle API and SSO routes
    if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith("/sso/", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith("/health", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    // ✅ Static files and JSON requests
    if (path.Contains('.') ||
        context.Request.Headers.Accept.ToString()
               .Contains("application/json", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    var indexPath = Path.Combine(app.Environment.WebRootPath, "index.html");
    if (!File.Exists(indexPath))
    {
        await next();
        return;
    }

    var html = await File.ReadAllTextAsync(indexPath);

    var baseHref = context.Request.PathBase.HasValue
        ? context.Request.PathBase.Value + "/"
        : "/";

    if (!baseHref.EndsWith("/")) baseHref += "/";

    html = html.Replace("%BASE_HREF%", baseHref);
    

    html = html.Replace(
        "<head>",
        $"<head>\n<script>window.__BASE_HREF__ = \"{baseHref}\";</script>"
    );
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(html);
});

// 3️⃣ API endpoints
app.MapControllers();

// 4️⃣ SPA fallback LAST (very important)
app.MapFallbackToFile("index.html");


app.Run();
