import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

@Injectable()
export class ExamSessionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /* -------------------------------------------------------
   *  START EXAM SESSION
   * -----------------------------------------------------*/
  async startSession(examId: string, studentId: string) {
    const { data: existing, error: existingError } = await this.supabase
      .from("exam_sessions")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", studentId)
      .eq("finished", false)
      .limit(1)
      .maybeSingle();

    if (existingError) throw new InternalServerErrorException(existingError.message);
    if (existing) return existing;

    const { data, error } = await this.supabase
      .from("exam_sessions")
      .insert({
        exam_id: examId,
        student_id: studentId,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /* -------------------------------------------------------
   *  INCREMENT TAB SWITCH
   * -----------------------------------------------------*/
  async incrementTabSwitch(sessionId: string) {
    const { data: session, error: getErr } = await this.supabase
      .from("exam_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (getErr || !session) throw new NotFoundException("Session not found");

    const newCount = (session.tab_switch_count || 0) + 1;

    const { data, error } = await this.supabase
      .from("exam_sessions")
      .update({ tab_switch_count: newCount })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /* -------------------------------------------------------
   *  FINISH SESSION
   * -----------------------------------------------------*/
  async finishSession(sessionId: string) {
    const { data, error } = await this.supabase
      .from("exam_sessions")
      .update({
        finished: true,
        status: "finished",
        finished_reason: "submitted",
        finished_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async disqualifySession(sessionId: string, reason = "proctoring_violation") {
    const { data, error } = await this.supabase
      .from("exam_sessions")
      .update({
        finished: true,
        status: "disqualified",
        finished_reason: reason,
        finished_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /* -------------------------------------------------------
   *  UPLOAD & COMPRESS VIDEO
   * -----------------------------------------------------*/
  async uploadVideo(sessionId: string, file: Express.Multer.File, user: any) {
    try {
      if (!file)
        throw new InternalServerErrorException("No file uploaded");

      /* =========================================
       * GET exam_id FROM exam_sessions
       * =========================================*/
      const { data: session, error: sErr } = await this.supabase
        .from("exam_sessions")
        .select("exam_id")
        .eq("id", sessionId)
        .single();

      if (sErr || !session)
        throw new InternalServerErrorException("Session not found");

      /* =========================================
       * UPLOAD TO SUPABASE STORAGE
       * =========================================*/
      const contentType = file.mimetype || "video/webm";
      const extension = contentType.includes("mp4") ? "mp4" : "webm";
      const fileName = `session-${sessionId}-${Date.now()}-${randomUUID()}.${extension}`;
      const storagePath = `session-recordings/${fileName}`;

      const { error: uploadErr } = await this.supabase.storage
        .from("exam-recordings")
        .upload(storagePath, file.buffer, {
          contentType,
          upsert: true,
        });

      if (uploadErr) {
        console.error("SUPABASE UPLOAD ERROR:", uploadErr);
        throw new InternalServerErrorException(`Supabase Storage Error: ${uploadErr.message}`);
      }

      const publicUrl = this.supabase.storage
        .from("exam-recordings")
        .getPublicUrl(storagePath).data.publicUrl;

      if (!publicUrl) {
        throw new InternalServerErrorException("Failed to generate public URL for the recording");
      }

      /* =========================================
       * UPDATE exam_submissions if answers were already submitted.
       * Do not create an empty submission here; submit() owns answer rows.
       * =========================================*/
      const { data: submission, error: subSelectErr } = await this.supabase
        .from("exam_submissions")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (subSelectErr) {
        throw new InternalServerErrorException(`Database Error: ${subSelectErr.message}`);
      }

      if (submission) {
        const { error: updateErr } = await this.supabase
          .from("exam_submissions")
          .update({
            file_name: fileName,
            file_url: publicUrl,
            student_id: user?.sub,
            updated_by: user?.sub,
            updated_at: new Date(),
          })
          .eq("id", submission.id);

        if (updateErr) throw new InternalServerErrorException(`Update Submission Error: ${updateErr.message}`);
      }

      return {
        success: true,
        fileName,
        fileUrl: publicUrl,
        linkedToSubmission: Boolean(submission),
        message: submission
          ? "Video uploaded successfully"
          : "Video uploaded successfully; submission row not found yet",
      };
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      throw new InternalServerErrorException(
        err?.message || "Failed to upload or compress video"
      );
    }
  }
}
