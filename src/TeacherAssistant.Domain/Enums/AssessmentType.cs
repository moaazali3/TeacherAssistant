using System.Text.Json.Serialization;

namespace TeacherAssistant.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AssessmentType
{
    Homework = 1,
    Exam = 2
}
