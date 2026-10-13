using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Courses;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.Infrastructure.Services.Courses;

public class CourseService : ICourseService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CourseService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<IEnumerable<CourseDto>>> GetAllCoursesAsync(CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // Retrieve active courses from _context.Courses including Instructor and Lessons details
        await Task.CompletedTask;
        return ApiResponse<IEnumerable<CourseDto>>.SuccessResponse(new List<CourseDto>(), "Fetched courses list stub.");
    }

    public async Task<ApiResponse<CourseDto?>> GetCourseByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // Query course by Id from _context.Courses with lessons, materials and quizzes
        await Task.CompletedTask;
        return ApiResponse<CourseDto?>.SuccessResponse(null, "Course details stub.");
    }

    public async Task<ApiResponse<CourseDto>> CreateCourseAsync(CreateCourseDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Validate instructor role using _currentUserService
        // 2. Map request to Course entity with InstructorId
        // 3. Save changes in _context.Courses
        await Task.CompletedTask;
        return ApiResponse<CourseDto>.SuccessResponse(new CourseDto
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            ThumbnailUrl = request.ThumbnailUrl
        }, "Course created stub.");
    }

    public async Task<ApiResponse<LessonDto>> AddMaterialAsync(Guid courseId, CreateLessonDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Verify instructor owns courseId
        // 2. Handle file/media upload (PDF, Video) and set VideoUrl or AttachmentUrl
        // 3. Add Lesson entity to _context.Lessons and save
        await Task.CompletedTask;
        return ApiResponse<LessonDto>.SuccessResponse(new LessonDto
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            Title = request.Title,
            ContentType = request.ContentType,
            VideoUrl = request.VideoUrl,
            AttachmentUrl = request.AttachmentUrl
        }, "Lesson material added stub.");
    }
}
