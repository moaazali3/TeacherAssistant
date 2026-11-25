import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/ui/PageLayout';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { tenantPath } from '@/lib/tenant';
import { getApiErrorMessage } from '@/lib/api';
import { quizzesApi } from '../api';
import { QuizDetailDto, normalizeAssessmentType } from '../types';
import { Clock, CheckCircle2, XCircle, Award, Send, ArrowRight } from 'lucide-react';

export const QuizTakePage: React.FC = () => {
  const { subjectId, quizId } = useParams<{ subjectId: string; quizId: string }>();
  const { success, error: toastError } = useToast();

  const [quiz, setQuiz] = useState<QuizDetailDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const loadQuiz = async () => {
    if (!quizId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await quizzesApi.getQuizDetail(quizId);
      setQuiz(data);
      if (data.mySubmission?.answers) {
        setAnswers(data.mySubmission.answers);
      }
      if (!data.mySubmission && data.durationMinutes && data.durationMinutes > 0) {
        setSecondsLeft(data.durationMinutes * 60);
      } else {
        setSecondsLeft(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحميل التقييم'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuiz();
  }, [quizId]);

  const handleSubmitAnswers = async (autoSubmitted = false) => {
    if (!quiz || quiz.mySubmission || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await quizzesApi.submitAnswers(quiz.id, { answers: answersRef.current });
      const refreshed = await quizzesApi.getQuizDetail(quiz.id);
      setQuiz(refreshed);
      setSecondsLeft(null);
      success(
        autoSubmitted
          ? 'انتهى وقت الامتحان وتم تسليم إجاباتك تلقائياً!'
          : 'تم تسليم إجاباتك وتصحيحها بنجاح!'
      );
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تسليم الإجابات'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRef = useRef(handleSubmitAnswers);
  submitRef.current = handleSubmitAnswers;

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || quiz?.mySubmission) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          void submitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft !== null && secondsLeft > 0, quiz?.mySubmission]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const kind = quiz ? normalizeAssessmentType(quiz.type) : 'Homework';
  const mySubmission = quiz?.mySubmission;

  return (
    <PageLayout
      isLoading={isLoading}
      skeleton={
        <div className="max-w-3xl mx-auto space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      }
      error={error}
      onRetry={loadQuiz}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'المواد', href: tenantPath('/subjects') },
            ...(subjectId
              ? [{ label: 'المادة', href: tenantPath(`/subjects/${subjectId}`) }]
              : []),
            { label: quiz?.title || 'التقييم' },
          ]}
        />
      }
      actions={
        subjectId ? (
          <Link to={tenantPath(`/subjects/${subjectId}`)}>
            <Button variant="outline" size="sm" startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
              العودة للمادة
            </Button>
          </Link>
        ) : null
      }
    >
      {quiz && (
        <div className="max-w-3xl mx-auto space-y-6 text-start">
          {/* Header Card */}
          <Card className="border-border">
            <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={kind === 'Exam' ? 'primary' : 'info'} size="sm">
                    {kind === 'Exam' ? 'امتحان' : 'واجب'}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {quiz.questionsCount} سؤال • {quiz.totalScore} درجة
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-text-main">
                  {quiz.title}
                </h1>
              </div>

              {secondsLeft !== null && !mySubmission && (
                <div
                  className={`px-4 py-2 rounded-xl border font-mono font-bold text-sm flex items-center gap-2 shrink-0 ${
                    secondsLeft <= 60
                      ? 'border-danger/40 bg-danger-bg text-danger animate-pulse'
                      : 'border-primary/30 bg-primary-subtle text-primary'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span dir="ltr">{formatTimer(secondsLeft)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-graded Result Banner */}
          {mySubmission && (
            <Card
              className={`border-2 ${
                mySubmission.passed
                  ? 'border-emerald-300 bg-emerald-50/70'
                  : 'border-warning/50 bg-warning-bg/50'
              }`}
            >
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Award
                    className={`w-8 h-8 shrink-0 ${
                      mySubmission.passed ? 'text-emerald-600' : 'text-warning'
                    }`}
                  />
                  <div>
                    <h2 className="font-bold text-base text-text-main">
                      نتيجتك: {mySubmission.score} من {mySubmission.totalScore} (
                      {mySubmission.percentage}%)
                    </h2>
                    {mySubmission.feedback && (
                      <p className="text-xs text-text-muted mt-1">{mySubmission.feedback}</p>
                    )}
                  </div>
                </div>
                <Badge variant={mySubmission.passed ? 'success' : 'warning'} size="md">
                  {mySubmission.passed ? 'ناجح ✓' : 'أقل من نسبة النجاح'}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {quiz.questions.map((q, idx) => {
              const selected = answers[q.id];
              const isSubmitted = !!mySubmission;
              const correctIdx = q.correctOptionIndex;

              return (
                <Card key={q.id} className="border-border">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-text-main">
                        <span className="text-primary ms-1">{idx + 1}.</span> {q.prompt}
                      </h3>
                      <Badge variant="neutral" size="sm" className="shrink-0">
                        {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const isChosen = selected === optIdx;
                        const isCorrectOption = isSubmitted && correctIdx === optIdx;
                        const isWrongChosen = isSubmitted && isChosen && correctIdx !== optIdx;

                        let styleClass =
                          'border-border bg-surface hover:border-primary/50 text-text-main';
                        if (isSubmitted) {
                          if (isCorrectOption) {
                            styleClass =
                              'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          } else if (isWrongChosen) {
                            styleClass = 'border-danger bg-danger-bg text-danger font-bold';
                          } else {
                            styleClass = 'border-border bg-surface-subtle text-text-muted';
                          }
                        } else if (isChosen) {
                          styleClass = 'border-primary bg-primary/10 text-primary font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`w-full text-start px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-sm ${styleClass}`}
                          >
                            <span>{option}</span>
                            {isCorrectOption && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isWrongChosen && (
                              <XCircle className="w-4 h-4 text-danger shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!mySubmission && (
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-surface sticky bottom-4 shadow-md">
              <span className="text-xs text-text-muted">
                تمت الإجابة على {Object.keys(answers).length} من {quiz.questions.length} سؤال
              </span>
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                onClick={() => void handleSubmitAnswers(false)}
                startIcon={<Send className="w-4 h-4" />}
                className="font-bold"
              >
                تسليم الإجابات وعرض الدرجة
              </Button>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
};
