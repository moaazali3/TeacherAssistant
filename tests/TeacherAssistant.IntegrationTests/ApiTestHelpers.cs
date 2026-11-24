using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Application.DTOs.Tenants;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure.Persistence;

namespace TeacherAssistant.IntegrationTests;

public static class ApiTestHelpers
{
    public const string DefaultPassword = "Password@123";

    public static async Task<AuthResponseDto> RegisterTeacherAsync(
        HttpClient client,
        string subdomain,
        string email,
        string? tenantName = null)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/register-teacher", new RegisterTeacherRequestDto
        {
            Name = $"Teacher {subdomain}",
            Email = email,
            Password = DefaultPassword,
            Subdomain = subdomain,
            TenantName = tenantName ?? $"Academy {subdomain}",
            PrimaryColor = "#112233",
            Bio = "Bio"
        });

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponseDto>>();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.Success);
        return body.Data!;
    }

    /// <summary>
    /// Creates a published subject and one group with the teacher token,
    /// returning the generated join code.
    /// </summary>
    public static async Task<(Guid SubjectId, Guid GroupId, string JoinCode)> CreateSubjectWithGroupAsync(
        HttpClient client,
        string tenant,
        string teacherToken,
        string? subjectTitle = null,
        string? groupName = null,
        bool isPublished = true)
    {
        var subjectResponse = await client.SendAsync(CreateRequest(
            HttpMethod.Post,
            "/api/v1/subjects",
            tenant,
            teacherToken,
            new CreateSubjectDto
            {
                Title = subjectTitle ?? "Subject",
                Description = "Test subject",
                IsPublished = isPublished
            }));

        var subjectBody = await ReadApiResponseAsync<SubjectSummaryDto>(subjectResponse);
        Assert.Equal(HttpStatusCode.Created, subjectResponse.StatusCode);

        var subjectId = subjectBody.Data!.Id;

        var groupResponse = await client.SendAsync(CreateRequest(
            HttpMethod.Post,
            $"/api/v1/subjects/{subjectId}/groups",
            tenant,
            teacherToken,
            new CreateGroupDto { Name = groupName ?? "Group A" }));

        var groupBody = await ReadApiResponseAsync<GroupDto>(groupResponse);
        Assert.Equal(HttpStatusCode.Created, groupResponse.StatusCode);

        return (subjectId, groupBody.Data!.Id, groupBody.Data.JoinCode);
    }

    public static async Task<HttpResponseMessage> RegisterStudentAsync(
        HttpClient client,
        string? tenant,
        string email,
        string joinCode,
        string password = DefaultPassword,
        string phoneNumber = "01012345678",
        string parentPhoneNumber = "01112345678")
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register-student")
        {
            Content = JsonContent.Create(new RegisterStudentRequestDto
            {
                Name = $"Student {email}",
                Email = email,
                Password = password,
                PhoneNumber = phoneNumber,
                ParentPhoneNumber = parentPhoneNumber,
                JoinCode = joinCode
            })
        };
        AddTenant(request, tenant);

        return await client.SendAsync(request);
    }

    public static async Task<HttpResponseMessage> LoginAsync(
        HttpClient client,
        string? tenant,
        string email,
        string password = DefaultPassword)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = JsonContent.Create(new LoginRequestDto
            {
                Email = email,
                Password = password
            })
        };
        AddTenant(request, tenant);

        return await client.SendAsync(request);
    }

    /// <summary>
    /// Inserts a user with the requested role straight into the test database and logs in.
    /// Used for setup that the public API does not expose (for example a second instructor
    /// inside an existing tenant).
    /// </summary>
    public static async Task<AuthResponseDto> CreateUserDirectlyAndLoginAsync(
        ApiFactory factory,
        HttpClient client,
        string tenant,
        string email,
        UserRole role,
        string password = DefaultPassword)
    {
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tenantEntity = await dbContext.Tenants.SingleAsync(t => t.Subdomain == tenant);

            var user = new User
            {
                Name = $"{role} {email}",
                Email = email.Trim().ToLowerInvariant(),
                Role = role,
                TenantId = tenantEntity.Id
            };

            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            user.PasswordHash = hasher.HashPassword(user, password);

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }

        var response = await LoginAsync(client, tenant, email, password);
        var body = await ReadApiResponseAsync<AuthResponseDto>(response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body.Data);
        return body.Data!;
    }

    public static async Task<HttpResponseMessage> GetCurrentTenantAsync(HttpClient client, string? tenant)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/tenants/current");
        AddTenant(request, tenant);
        return await client.SendAsync(request);
    }

    public static async Task<HttpResponseMessage> UpdateCurrentTenantAsync(
        HttpClient client,
        string? tenant,
        string token,
        UpdateTenantBrandingDto branding)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/tenants/current")
        {
            Content = JsonContent.Create(branding)
        };
        AddTenant(request, tenant);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    /// <summary>Builds a request with an optional tenant header, bearer token and JSON body.</summary>
    public static HttpRequestMessage CreateRequest(
        HttpMethod method,
        string path,
        string? tenant = null,
        string? token = null,
        object? body = null)
    {
        var request = new HttpRequestMessage(method, path);
        AddTenant(request, tenant);

        if (body is not null)
            request.Content = JsonContent.Create(body);

        if (!string.IsNullOrWhiteSpace(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return request;
    }

    public static async Task<ApiResponse<T>> ReadApiResponseAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<T>>();
        Assert.NotNull(body);
        return body!;
    }

    private static void AddTenant(HttpRequestMessage request, string? tenant)
    {
        if (!string.IsNullOrWhiteSpace(tenant))
            request.Headers.Add("X-Tenant", tenant);
    }
}
