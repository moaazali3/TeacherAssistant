using System.Net;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class GroupsTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private const string OtherTenant = "rival";

    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;

    private AuthResponseDto _owner = null!;
    private AuthResponseDto _otherTeacher = null!;
    private AuthResponseDto _rivalTeacher = null!;
    private AuthResponseDto _student = null!;

    private Guid _subjectId;
    private Guid _groupId;
    private string _joinCode = string.Empty;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _owner = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "owner@example.com", "Owner Academy");

        _otherTeacher = await ApiTestHelpers.CreateUserDirectlyAndLoginAsync(
            _factory, _client, Tenant, "second-teacher@example.com", UserRole.Instructor);

        _rivalTeacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, OtherTenant, "rival@example.com", "Rival Academy");

        (_subjectId, _groupId, _joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, "Chemistry", "Saturday 5pm");

        _student = await RegisterStudentAsync("student@example.com", _joinCode);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    // ---------------------------------------------------------------------
    // Registration by join code
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Registration_without_a_join_code_is_rejected()
    {
        var noCode = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            "/api/v1/auth/register-student",
            Tenant,
            body: new { Name = "No Code", Email = "nocode@example.com", Password = ApiTestHelpers.DefaultPassword }));

        Assert.Equal(HttpStatusCode.BadRequest, noCode.StatusCode);

        var shortCode = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "short@example.com", "ABC");
        Assert.Equal(HttpStatusCode.BadRequest, shortCode.StatusCode);

        var emptyCode = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "empty@example.com", string.Empty);
        Assert.Equal(HttpStatusCode.BadRequest, emptyCode.StatusCode);

        // No accounts were created for the rejected attempts.
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await ApiTestHelpers.LoginAsync(_client, Tenant, "nocode@example.com")).StatusCode);
    }

    [Fact]
    public async Task Join_code_from_another_tenant_is_rejected()
    {
        var (_, _, rivalCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, OtherTenant, _rivalTeacher.Token, "Rival subject", "Rival group");

        // The very same string is valid inside the rival tenant...
        var validInOwnerTenant = await ApiTestHelpers.RegisterStudentAsync(
            _client, OtherTenant, "rival-student@example.com", rivalCode);
        Assert.Equal(HttpStatusCode.OK, validInOwnerTenant.StatusCode);

        // ...but must not resolve inside another tenant.
        var crossTenant = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "cross-tenant@example.com", rivalCode);
        Assert.Equal(HttpStatusCode.BadRequest, crossTenant.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(crossTenant);
        Assert.False(body.Success);
        Assert.Contains("Invalid join code", body.Message);
    }

    [Fact]
    public async Task Registration_with_a_valid_code_creates_the_membership()
    {
        var student = await RegisterStudentAsync("member@example.com", _joinCode);

        var mine = await GetMyGroupsAsync(student.Token);
        var only = Assert.Single(mine);
        Assert.Equal(_groupId, only.GroupId);
        Assert.Equal("Chemistry", only.SubjectTitle);
        Assert.Equal("Saturday 5pm", only.GroupName);

        var members = await GetStudentsAsync(_groupId, _owner.Token);
        var member = Assert.Single(members, m => m.Email == "member@example.com");
        Assert.Equal("01012345678", member.PhoneNumber);
        Assert.Equal("01112345678", member.ParentPhoneNumber);
        Assert.Equal(new DateOnly(2008, 5, 15), member.DateOfBirth);
        Assert.Equal(Gender.Male, member.Gender);
    }

    [Fact]
    public async Task Registration_requires_valid_date_of_birth_and_gender()
    {
        var missingProfile = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            "/api/v1/auth/register-student",
            Tenant,
            body: new
            {
                Name = "Missing Profile",
                Email = "missingprofile@example.com",
                Password = ApiTestHelpers.DefaultPassword,
                PhoneNumber = "01012345678",
                ParentPhoneNumber = "01112345678",
                JoinCode = _joinCode
            }));
        Assert.Equal(HttpStatusCode.BadRequest, missingProfile.StatusCode);

        var futureBirth = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "futurebirth@example.com", _joinCode,
            dateOfBirth: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            gender: Gender.Female);
        Assert.Equal(HttpStatusCode.BadRequest, futureBirth.StatusCode);
    }

    [Fact]
    public async Task Registration_requires_valid_distinct_phone_and_parent_phone_numbers()
    {
        var missingPhones = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            "/api/v1/auth/register-student",
            Tenant,
            body: new
            {
                Name = "No Phones",
                Email = "nophones@example.com",
                Password = ApiTestHelpers.DefaultPassword,
                JoinCode = _joinCode
            }));
        Assert.Equal(HttpStatusCode.BadRequest, missingPhones.StatusCode);

        var invalidPhone = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "badphone@example.com", _joinCode,
            phoneNumber: "abc", parentPhoneNumber: "01112345678");
        Assert.Equal(HttpStatusCode.BadRequest, invalidPhone.StatusCode);

        var samePhones = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "samephones@example.com", _joinCode,
            phoneNumber: "01012345678", parentPhoneNumber: "01012345678");
        Assert.Equal(HttpStatusCode.BadRequest, samePhones.StatusCode);

        var sameBody = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(samePhones);
        Assert.False(sameBody.Success);
    }

    [Fact]
    public async Task Code_must_be_active_and_the_group_open_to_accept_joins()
    {
        var toggled = await SendAsync(HttpMethod.Post, $"/api/v1/groups/{_groupId}/toggle-code", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, toggled.StatusCode);
        var toggledBody = await ApiTestHelpers.ReadApiResponseAsync<GroupDto>(toggled);
        Assert.False(toggledBody.Data!.IsCodeActive);

        var whileInactive = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "inactive@example.com", _joinCode);
        Assert.Equal(HttpStatusCode.BadRequest, whileInactive.StatusCode);
        var inactiveBody = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(whileInactive);
        Assert.Contains("no longer active", inactiveBody.Message);

        // Toggle it back on: registration works again.
        await SendAsync(HttpMethod.Post, $"/api/v1/groups/{_groupId}/toggle-code", _owner.Token);
        var afterReactivating = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "reactivated@example.com", _joinCode);
        Assert.Equal(HttpStatusCode.OK, afterReactivating.StatusCode);

        // Regenerating invalidates the previous code.
        var regenerated = await SendAsync(
            HttpMethod.Post, $"/api/v1/groups/{_groupId}/regenerate-code", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, regenerated.StatusCode);
        var regeneratedBody = await ApiTestHelpers.ReadApiResponseAsync<GroupDto>(regenerated);
        var newCode = regeneratedBody.Data!.JoinCode;

        Assert.NotEqual(_joinCode, newCode);
        Assert.Equal(JoinCodeRules.Length, newCode.Length);
        Assert.All(newCode, c => Assert.Contains(c, JoinCodeRules.Alphabet));

        var oldCodeNowFails = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "old-code@example.com", _joinCode);
        Assert.Equal(HttpStatusCode.BadRequest, oldCodeNowFails.StatusCode);

        var newCodeWorks = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "new-code@example.com", newCode);
        Assert.Equal(HttpStatusCode.OK, newCodeWorks.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Student joins
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Second_group_in_the_same_subject_returns_409()
    {
        var secondGroup = await CreateGroupAsync(_subjectId, _owner.Token, "Monday 7pm");

        var response = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = secondGroup.JoinCode });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<MyGroupDto>(response);
        Assert.False(body.Success);
        Assert.Contains("already joined a group in this subject", body.Message);
    }

    [Fact]
    public async Task Student_can_join_a_group_of_another_subject()
    {
        var (otherSubjectId, _, otherCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, "Physics", "Physics evening");

        var response = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = otherCode });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<MyGroupDto>(response);
        Assert.Equal(otherSubjectId, body.Data!.SubjectId);

        var mine = await GetMyGroupsAsync(_student.Token);
        Assert.Equal(2, mine.Count);
        Assert.Contains(mine, g => g.SubjectTitle == "Chemistry");
        Assert.Contains(mine, g => g.SubjectTitle == "Physics");
    }

    [Fact]
    public async Task Students_only_list_the_subjects_they_joined()
    {
        var (otherSubjectId, _, _) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, "Physics", "Physics evening");

        var asStudent = await SendAsync(HttpMethod.Get, "/api/v1/subjects", _student.Token);
        var studentList = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(asStudent);
        var only = Assert.Single(studentList.Data!);
        Assert.Equal("Chemistry", only.Title);

        // Anonymous visitors still see the published catalogue.
        var anonymous = await SendAsync(HttpMethod.Get, "/api/v1/subjects");
        var anonymousList = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(anonymous);
        Assert.Equal(2, anonymousList.Data!.Count);

        // The owner keeps seeing all of their subjects, drafts included.
        await SendAsync(HttpMethod.Post, "/api/v1/subjects", _owner.Token,
            new CreateSubjectDto { Title = "Draft only", IsPublished = false });
        var asOwner = await SendAsync(HttpMethod.Get, "/api/v1/subjects/mine", _owner.Token);
        var ownerList = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(asOwner);
        Assert.Equal(3, ownerList.Data!.Count);

        // Subject detail of a subject the student did not join is a 404.
        var hidden = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{otherSubjectId}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Ownership rules
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Another_teacher_cannot_manage_another_teachers_groups()
    {
        var update = await SendAsync(HttpMethod.Put, $"/api/v1/groups/{_groupId}",
            _otherTeacher.Token, new UpdateGroupDto { Name = "Hijacked" });
        Assert.Equal(HttpStatusCode.Forbidden, update.StatusCode);

        var delete = await SendAsync(HttpMethod.Delete, $"/api/v1/groups/{_groupId}", _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, delete.StatusCode);

        var regenerate = await SendAsync(
            HttpMethod.Post, $"/api/v1/groups/{_groupId}/regenerate-code", _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, regenerate.StatusCode);

        var toggle = await SendAsync(
            HttpMethod.Post, $"/api/v1/groups/{_groupId}/toggle-code", _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, toggle.StatusCode);

        var members = await SendAsync(HttpMethod.Get, $"/api/v1/groups/{_groupId}/students", _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, members.StatusCode);

        var createInSomeoneElsesSubject = await SendAsync(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/groups", _otherTeacher.Token,
            new CreateGroupDto { Name = "Intruder group" });
        Assert.Equal(HttpStatusCode.Forbidden, createInSomeoneElsesSubject.StatusCode);

        // The owner's group is untouched.
        var groups = await GetGroupsAsync(_subjectId, _owner.Token);
        var group = Assert.Single(groups);
        Assert.Equal("Saturday 5pm", group.Name);
        Assert.True(group.IsCodeActive);
        Assert.Equal(_joinCode, group.JoinCode);
    }

    [Fact]
    public async Task Teachers_of_another_tenant_cannot_see_or_touch_the_groups()
    {
        var groups = await SendAsync(
            HttpMethod.Get, $"/api/v1/subjects/{_subjectId}/groups", _rivalTeacher.Token, tenant: OtherTenant);
        Assert.Equal(HttpStatusCode.NotFound, groups.StatusCode);

        var update = await SendAsync(HttpMethod.Put, $"/api/v1/groups/{_groupId}",
            _rivalTeacher.Token, new UpdateGroupDto { Name = "Stolen" }, OtherTenant);
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Group management
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Group_lifecycle_works()
    {
        var groups = await GetGroupsAsync(_subjectId, _owner.Token);
        var initial = Assert.Single(groups);
        Assert.Equal(1, initial.StudentsCount);

        var update = await SendAsync(HttpMethod.Put, $"/api/v1/groups/{_groupId}", _owner.Token,
            new UpdateGroupDto { Name = "Saturday morning", ScheduleText = "Saturdays 11:00" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = await ApiTestHelpers.ReadApiResponseAsync<GroupDto>(update);
        Assert.Equal("Saturday morning", updated.Data!.Name);
        Assert.Equal("Saturdays 11:00", updated.Data.ScheduleText);

        var created = await CreateGroupAsync(_subjectId, _owner.Token, "Monday 7pm");
        Assert.Equal(JoinCodeRules.Length, created.JoinCode.Length);
        Assert.NotEqual(_joinCode, created.JoinCode);

        var afterCreate = await GetGroupsAsync(_subjectId, _owner.Token);
        Assert.Equal(2, afterCreate.Count);

        var delete = await SendAsync(HttpMethod.Delete, $"/api/v1/groups/{created.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, delete.StatusCode);

        var afterDelete = await GetGroupsAsync(_subjectId, _owner.Token);
        Assert.Single(afterDelete);
    }

    [Fact]
    public async Task Moving_a_student_between_groups_of_the_same_subject_works()
    {
        var target = await CreateGroupAsync(_subjectId, _owner.Token, "Monday 7pm");
        var studentId = await GetStudentIdAsync("student@example.com");

        var move = await SendAsync(
            HttpMethod.Put, $"/api/v1/groups/{_groupId}/students/{studentId}/move",
            _owner.Token, new MoveStudentDto { TargetGroupId = target.Id });

        Assert.Equal(HttpStatusCode.OK, move.StatusCode);
        var moved = await ApiTestHelpers.ReadApiResponseAsync<GroupMemberDto>(move);
        Assert.Equal(target.Id, moved.Data!.GroupId);

        Assert.Empty(await GetStudentsAsync(_groupId, _owner.Token));
        Assert.Contains(await GetStudentsAsync(target.Id, _owner.Token), m => m.StudentId == studentId);

        var mine = await GetMyGroupsAsync(_student.Token);
        var membership = Assert.Single(mine);
        Assert.Equal(target.Id, membership.GroupId);

        // Moving into a group of another subject is rejected.
        var (otherSubjectId, _, _) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, "Physics", "Physics evening");
        var foreignGroup = (await GetGroupsAsync(otherSubjectId, _owner.Token)).Single();

        var invalidMove = await SendAsync(
            HttpMethod.Put, $"/api/v1/groups/{target.Id}/students/{studentId}/move",
            _owner.Token, new MoveStudentDto { TargetGroupId = foreignGroup.Id });
        Assert.Equal(HttpStatusCode.BadRequest, invalidMove.StatusCode);

        var invalidBody = await ApiTestHelpers.ReadApiResponseAsync<GroupMemberDto>(invalidMove);
        Assert.Contains("same subject", invalidBody.Message);
    }

    [Fact]
    public async Task Removing_a_student_revokes_access_until_they_join_again()
    {
        var studentId = await GetStudentIdAsync("student@example.com");

        var remove = await SendAsync(
            HttpMethod.Delete, $"/api/v1/groups/{_groupId}/students/{studentId}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, remove.StatusCode);

        Assert.Empty(await GetMyGroupsAsync(_student.Token));

        var subjects = await SendAsync(HttpMethod.Get, "/api/v1/subjects", _student.Token);
        var subjectList = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(subjects);
        Assert.Empty(subjectList.Data!);

        var detail = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, detail.StatusCode);

        // The code is still valid, so the student may join again.
        var rejoin = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = _joinCode });
        Assert.Equal(HttpStatusCode.Created, rejoin.StatusCode);
        Assert.Single(await GetMyGroupsAsync(_student.Token));
    }

    // ---------------------------------------------------------------------
    // Instructor helpers
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Teacher_can_reset_a_student_password()
    {
        var studentId = await GetStudentIdAsync("student@example.com");
        const string newPassword = "FreshPass@123";

        var reset = await SendAsync(
            HttpMethod.Post, $"/api/v1/students/{studentId}/reset-password",
            _owner.Token, new ResetStudentPasswordDto { NewPassword = newPassword });
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

        var oldPassword = await ApiTestHelpers.LoginAsync(
            _client, Tenant, "student@example.com", ApiTestHelpers.DefaultPassword);
        Assert.Equal(HttpStatusCode.Unauthorized, oldPassword.StatusCode);

        var newPasswordLogin = await ApiTestHelpers.LoginAsync(
            _client, Tenant, "student@example.com", newPassword);
        Assert.Equal(HttpStatusCode.OK, newPasswordLogin.StatusCode);

        // Students cannot reset passwords.
        var asStudent = await SendAsync(
            HttpMethod.Post, $"/api/v1/students/{studentId}/reset-password",
            _student.Token, new ResetStudentPasswordDto { NewPassword = "Another@123" });
        Assert.Equal(HttpStatusCode.Forbidden, asStudent.StatusCode);

        // Another tenant cannot reach the student.
        var asRival = await SendAsync(
            HttpMethod.Post, $"/api/v1/students/{studentId}/reset-password",
            _rivalTeacher.Token, new ResetStudentPasswordDto { NewPassword = "Another@123" }, OtherTenant);
        Assert.Equal(HttpStatusCode.NotFound, asRival.StatusCode);
    }

    [Fact]
    public async Task Password_reset_rejects_a_short_password()
    {
        var studentId = await GetStudentIdAsync("student@example.com");

        var response = await SendAsync(
            HttpMethod.Post, $"/api/v1/students/{studentId}/reset-password",
            _owner.Token, new ResetStudentPasswordDto { NewPassword = "short" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Groups_mine_is_student_only()
    {
        var asTeacher = await SendAsync(HttpMethod.Get, "/api/v1/groups/mine", _owner.Token);
        Assert.Equal(HttpStatusCode.Forbidden, asTeacher.StatusCode);

        var anonymous = await SendAsync(HttpMethod.Get, "/api/v1/groups/mine");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------


    private async Task<AuthResponseDto> RegisterStudentAsync(string email, string joinCode)
    {
        var response = await ApiTestHelpers.RegisterStudentAsync(_client, Tenant, email, joinCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body.Success);
        return body.Data!;
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string path,
        string? token = null,
        object? body = null,
        string? tenant = null)
        => await _client.SendAsync(
            ApiTestHelpers.CreateRequest(method, path, tenant ?? Tenant, token, body));

    private async Task<GroupDto> CreateGroupAsync(Guid subjectId, string token, string name)
    {
        var response = await SendAsync(HttpMethod.Post, $"/api/v1/subjects/{subjectId}/groups", token,
            new CreateGroupDto { Name = name, ScheduleText = $"{name} schedule" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<GroupDto>(response);
        return body.Data!;
    }

    private async Task<List<GroupDto>> GetGroupsAsync(Guid subjectId, string token)
    {
        var response = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{subjectId}/groups", token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<List<GroupDto>>(response);
        return body.Data!;
    }

    private async Task<List<GroupMemberDto>> GetStudentsAsync(Guid groupId, string token)
    {
        var response = await SendAsync(HttpMethod.Get, $"/api/v1/groups/{groupId}/students", token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<List<GroupMemberDto>>(response);
        return body.Data!;
    }

    private async Task<List<MyGroupDto>> GetMyGroupsAsync(string token)
    {
        var response = await SendAsync(HttpMethod.Get, "/api/v1/groups/mine", token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<List<MyGroupDto>>(response);
        return body.Data!;
    }

    private async Task<Guid> GetStudentIdAsync(string email)
    {
        var members = await GetStudentsAsync(_groupId, _owner.Token);
        return members.Single(m => m.Email == email).StudentId;
    }
}
