namespace TeacherAssistant.Domain.Enums;

/// <summary>
/// Controls when a quiz/homework is taken relative to a lecture:
/// BeforeLesson = prerequisite quiz to unlock the lecture,
/// AfterLesson = post-lecture homework or evaluation,
/// General = standalone subject-level assessment.
/// </summary>
public enum AssessmentPlacement
{
    AfterLesson = 0,
    BeforeLesson = 1,
    General = 2
}
