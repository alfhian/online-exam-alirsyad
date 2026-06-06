import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

type ExamSubmissionJob = {
  id: string;
  type: string;
  submission_id: string;
  exam_id: string;
  session_id: string;
  answers: any[];
  updated_by?: string | null;
  attempts: number;
  max_attempts: number;
};

@Injectable()
export class ExamSubmissionJobWorker implements OnModuleInit, OnModuleDestroy {
  private readonly batchSize = Number(process.env.EXAM_SUBMISSION_JOB_BATCH_SIZE || 5);
  private readonly pollIntervalMs = Number(process.env.EXAM_SUBMISSION_JOB_POLL_MS || 5000);
  private readonly staleLockMs = Number(process.env.EXAM_SUBMISSION_JOB_STALE_LOCK_MS || 120000);
  private interval?: NodeJS.Timeout;
  private processing = false;

  constructor(private readonly supabase: SupabaseClient) {}

  onModuleInit() {
    if (process.env.ENABLE_EXAM_SUBMISSION_JOB_WORKER === 'false') return;

    this.processPendingJobs();
    this.interval = setInterval(() => this.processPendingJobs(), this.pollIntervalMs);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async processPendingJobs() {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.releaseStaleJobs();

      const { data: jobs, error } = await this.supabase
        .from('exam_submission_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('available_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(this.batchSize);

      if (error) {
        console.error('Failed to fetch exam submission jobs:', error.message);
        return;
      }

      for (const job of jobs || []) {
        const claimedJob = await this.claimJob(job as ExamSubmissionJob);
        if (!claimedJob) continue;

        await this.processJob(claimedJob);
      }
    } finally {
      this.processing = false;
    }
  }

  private async releaseStaleJobs() {
    const staleBefore = new Date(Date.now() - this.staleLockMs).toISOString();
    const { error } = await this.supabase
      .from('exam_submission_jobs')
      .update({
        status: 'pending',
        locked_at: null,
        updated_at: new Date(),
      })
      .eq('status', 'processing')
      .lt('locked_at', staleBefore);

    if (error) console.error('Failed to release stale exam submission jobs:', error.message);
  }

  private async claimJob(job: ExamSubmissionJob): Promise<ExamSubmissionJob | null> {
    const { data, error } = await this.supabase
      .from('exam_submission_jobs')
      .update({
        status: 'processing',
        attempts: (job.attempts || 0) + 1,
        locked_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Failed to claim exam submission job:', error.message);
      return null;
    }

    return data as ExamSubmissionJob | null;
  }

  private async processJob(job: ExamSubmissionJob) {
    try {
      if (job.type !== 'score_exam_submission') {
        throw new Error(`Unsupported exam submission job type: ${job.type}`);
      }

      await this.finishSession(job.session_id);
      await this.scoreSubmission(job);
      await this.markCompleted(job.id);
    } catch (err) {
      await this.markFailed(job, err?.message || String(err));
    }
  }

  private async finishSession(sessionId: string) {
    const { error } = await this.supabase
      .from('exam_sessions')
      .update({ finished: true })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to mark exam session finished: ${error.message}`);
  }

  private async scoreSubmission(job: ExamSubmissionJob) {
    const { data: questions, error: qError } = await this.supabase
      .from('questionnaires')
      .select('id, type, answer')
      .eq('exam_id', job.exam_id)
      .is('deleted_at', null);

    if (qError) throw new Error(`Failed to fetch questions for submission scoring: ${qError.message}`);

    const { scoredAnswers, totalScore } = this.scoreAnswers(job.answers || [], questions || []);
    const { error } = await this.supabase
      .from('exam_submissions')
      .update({
        answers: scoredAnswers,
        score: totalScore,
        updated_at: new Date(),
        updated_by: job.updated_by,
      })
      .eq('id', job.submission_id);

    if (error) throw new Error(`Failed to score exam submission: ${error.message}`);
  }

  private scoreAnswers(answers: any[], questions: any[]) {
    const questionById = new Map((questions || []).map((question) => [String(question.id), question]));
    const mcQuestions = (questions || []).filter((question) => question.type === 'multiple_choice');
    const essayQuestions = (questions || []).filter((question) => question.type === 'essay');
    const multipleChoiceIds = new Set(mcQuestions.map((question) => String(question.id)));

    const scoredAnswers = answers.map((answer) => {
      const question = questionById.get(String(answer.question_id));
      const isCorrect =
        question?.type === 'multiple_choice'
          ? String(answer.answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase()
          : null;

      return { ...answer, is_correct: isCorrect };
    });

    const totalScore =
      mcQuestions.length > 0 && essayQuestions.length === 0
        ? Math.round(
            (scoredAnswers.filter(
              (answer) => multipleChoiceIds.has(String(answer.question_id)) && answer.is_correct === true,
            ).length /
              mcQuestions.length) *
              100,
          )
        : null;

    return { scoredAnswers, totalScore };
  }

  private async markCompleted(jobId: string) {
    const { error } = await this.supabase
      .from('exam_submission_jobs')
      .update({
        status: 'completed',
        locked_at: null,
        last_error: null,
        updated_at: new Date(),
      })
      .eq('id', jobId);

    if (error) console.error('Failed to mark exam submission job completed:', error.message);
  }

  private async markFailed(job: ExamSubmissionJob, message: string) {
    const shouldRetry = job.attempts < job.max_attempts;
    const retryDelayMs = Math.min(60000, 1000 * 2 ** Math.max(0, job.attempts - 1));
    const { error } = await this.supabase
      .from('exam_submission_jobs')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        locked_at: null,
        last_error: message,
        available_at: shouldRetry ? new Date(Date.now() + retryDelayMs) : new Date(),
        updated_at: new Date(),
      })
      .eq('id', job.id);

    if (error) console.error('Failed to mark exam submission job failed:', error.message);
    console.error(`Exam submission job ${job.id} failed:`, message);
  }
}
