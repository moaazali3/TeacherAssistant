using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Courses;

namespace TeacherAssistant.Application.Interfaces;

public interface ICourseService
{
    Task<ApiResponse<IEnumerable<CourseDto>>> GetAllCoursesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CourseDto?>> GetCourseByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CourseDto>> CreateCourseAsync(CreateCourseDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<LessonDto>> AddMaterialAsync(Guid courseId, CreateLessonDto request, CancellationToken cancellationToken = default);
}
