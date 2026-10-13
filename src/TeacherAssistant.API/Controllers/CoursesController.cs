using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Courses;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class CoursesController : BaseApiController
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    /// <summary>
    /// GET /api/v1/courses - جلب قائمة الكورسات المتاحة
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseDto>>>> GetAllCourses(CancellationToken cancellationToken)
    {
        var response = await _courseService.GetAllCoursesAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// GET /api/v1/courses/{id} - تفاصيل كورس محدد
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CourseDto?>>> GetCourseById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var response = await _courseService.GetCourseByIdAsync(id, cancellationToken);
        return response.Data != null ? Ok(response) : NotFound(response);
    }

    /// <summary>
    /// POST /api/v1/courses - إنشاء كورس جديد (للمدرسين)
    /// </summary>
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CourseDto>>> CreateCourse([FromBody] CreateCourseDto request, CancellationToken cancellationToken)
    {
        var response = await _courseService.CreateCourseAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetCourseById), new { id = response.Data?.Id }, response);
    }

    /// <summary>
    /// POST /api/v1/courses/{id}/materials - رفع مواد تعليمية لكورس محدد
    /// </summary>
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("{id:guid}/materials")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> AddMaterial(
        [FromRoute] Guid id,
        [FromBody] CreateLessonDto request,
        CancellationToken cancellationToken)
    {
        var response = await _courseService.AddMaterialAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
