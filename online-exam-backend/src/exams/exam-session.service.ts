import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { randomUUID } from "crypto";

@Injectable()
export class ExamSessionService {
  constructor(private readonly supabase: SupabaseClient) {
    // Set binary FFmpeg & FFprobe
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath.path);
  }

  /* -------------------------------------------------------
   *  START EXAM SESSION
   * -----------------------------------------------------*/
  async startSession(examId: string, studentId: string) {
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

      // Create folder
      const uploadDir = path.resolve("uploads", "exam-recordings");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      // Save RAW
      const rawFile = path.join(
        uploadDir,
        `raw-${sessionId}-${randomUUID()}.webm`
      );
      await fs.promises.writeFile(rawFile, file.buffer);

      // Prepare compressed path
      const compressedName = `session-${sessionId}-${Date.now()}.mp4`;
      const compressedPath = path.join(uploadDir, compressedName);

      /* =========================================
       * COMPRESS USING FFMPEG-STATIC
       * =========================================*/
      await new Promise((resolve, reject) => {
        ffmpeg(rawFile)
          .outputOptions([
            "-vcodec libx264",
            "-preset veryfast",
            "-crf 28",
            "-b:a 96k",
            "-vf scale=640:-1",
          ])
          .save(compressedPath)
          .on("end", resolve)
          .on("error", reject);
      });

      fs.unlinkSync(rawFile); // remove raw

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
      const fileBuffer = await fs.promises.readFile(compressedPath);
      const uint8 = new Uint8Array(fileBuffer);

      const storagePath = `session-recordings/${compressedName}`;

      const { error: uploadErr } = await this.supabase.storage
        .from("exam-recordings")
        .upload(storagePath, uint8, {
          contentType: "video/mp4",
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

      fs.unlinkSync(compressedPath); // clear local

      /* =========================================
       * UPDATE / INSERT exam_submissions
       * =========================================*/
      const { data: submissions, error: subSelectErr } = await this.supabase
        .from("exam_submissions")
        .select("id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subSelectErr) {
        throw new InternalServerErrorException(`Database Error: ${subSelectErr.message}`);
      }

      const submission = submissions?.[0];

      if (submission) {
        const { error: updateErr } = await this.supabase
          .from("exam_submissions")
          .update({
            file_name: compressedName,
            file_url: publicUrl,
            student_id: user?.sub,
            updated_by: user?.sub,
            updated_at: new Date(),
          })
          .eq("id", submission.id);

        if (updateErr) throw new InternalServerErrorException(`Update Submission Error: ${updateErr.message}`);
      } else {
        const { error: insertErr } = await this.supabase.from("exam_submissions").insert({
          session_id: sessionId,
          exam_id: session.exam_id,
          student_id: user?.sub,
          answers: {},
          file_name: compressedName,
          file_url: publicUrl,
          created_by: user?.sub,
        });

        if (insertErr) throw new InternalServerErrorException(`Insert Submission Error: ${insertErr.message}`);
      }

      return {
        success: true,
        fileName: compressedName,
        fileUrl: publicUrl,
        message: "Video uploaded & compressed successfully",
      };
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      throw new InternalServerErrorException(
        err?.message || "Failed to upload or compress video"
      );
    }
  }
}
