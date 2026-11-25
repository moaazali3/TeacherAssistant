namespace TeacherAssistant.Domain.Enums;

[Flags]
public enum AssistantPermissions
{
    None = 0,
    ViewStudentProgress = 1,
    ManageGroups = 2,
    ManageContent = 4,
    ManageAssessments = 8,
    All = ViewStudentProgress | ManageGroups | ManageContent | ManageAssessments
}
