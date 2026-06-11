import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY must be provided');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const STUDENT_COUNT = Number(process.env.LOAD_TEST_STUDENT_COUNT || 200);
const STUDENT_PREFIX = process.env.LOAD_TEST_STUDENT_PREFIX || 'loadtest';
const STUDENT_PASSWORD = process.env.LOAD_TEST_STUDENT_PASSWORD || '123456';
const CLASS_ID = process.env.LOAD_TEST_CLASS_ID || 'XI AK';
const CLASS_NAME = process.env.LOAD_TEST_CLASS_NAME || 'XI AK';
const SUBJECT_NAME = process.env.LOAD_TEST_SUBJECT_NAME || 'Load Test Bahasa Indonesia';
const EXAM_TITLE = process.env.LOAD_TEST_EXAM_TITLE || 'LOAD TEST SUBMIT API';
const EXAM_DURATION_MINUTES = Number(process.env.LOAD_TEST_EXAM_DURATION_MINUTES || 120);

const createdBy = 'load-test-seeder';

function assertSingle<T>(value: T | null, label: string): T {
  if (!value) throw new Error(`${label} was not created or found`);
  return value;
}

function userId(index: number) {
  return `${STUDENT_PREFIX}${String(index).padStart(3, '0')}`;
}

async function upsertClass() {
  const { error } = await supabase.from('classes').upsert(
    {
      id: CLASS_ID,
      name: CLASS_NAME,
      grade: 11,
      created_by: null,
      updated_at: new Date(),
    },
    { onConflict: 'id' },
  );

  if (error) throw new Error(`Failed to upsert class: ${error.message}`);
}

async function findOrCreateSubject() {
  const { data: existing, error: findError } = await supabase
    .from('subjects')
    .select('*')
    .eq('name', SUBJECT_NAME)
    .eq('class_id', CLASS_NAME)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(`Failed to find subject: ${findError.message}`);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name: SUBJECT_NAME,
      description: 'Subject dummy untuk load test submit ujian',
      class_id: CLASS_NAME,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create subject: ${error.message}`);
  return assertSingle(data, 'Subject');
}

async function findOrCreateExam(subjectId: string) {
  const { data: existing, error: findError } = await supabase
    .from('exams')
    .select('*')
    .eq('title', EXAM_TITLE)
    .eq('subject_id', subjectId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(`Failed to find exam: ${findError.message}`);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('exams')
    .insert({
      title: EXAM_TITLE,
      date: new Date().toISOString(),
      type: 'pilihan_ganda',
      duration: EXAM_DURATION_MINUTES,
      notes: 'Exam dummy untuk load test submit API',
      subject_id: subjectId,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create exam: ${error.message}`);
  return assertSingle(data, 'Exam');
}

async function findOrCreateQuestion(examId: string) {
  const { data: existing, error: findError } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('exam_id', examId)
    .eq('index', 1)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(`Failed to find question: ${findError.message}`);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('questionnaires')
    .insert({
      exam_id: examId,
      question: 'Load test: jawaban yang benar adalah A.',
      type: 'multiple_choice',
      options: [
        { type: 'text', value: 'A' },
        { type: 'text', value: 'B' },
        { type: 'text', value: 'C' },
        { type: 'text', value: 'D' },
      ],
      answer: 'A',
      index: 1,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create question: ${error.message}`);
  return assertSingle(data, 'Question');
}

async function seedStudents() {
  const passwordHash = bcrypt.hashSync(STUDENT_PASSWORD, 10);
  const rows = Array.from({ length: STUDENT_COUNT }, (_, index) => {
    const number = index + 1;
    const userid = userId(number);

    return {
      name: `Load Test Student ${String(number).padStart(3, '0')}`,
      userid,
      password: passwordHash,
      role: 'SISWA',
      is_active: true,
      class_id: null,
      class_name: CLASS_NAME,
      nisn: `LT${String(number).padStart(8, '0')}`,
      gender: number % 2 === 0 ? 'P' : 'L',
      description: 'Akun dummy load test',
      created_by: createdBy,
      updated_at: new Date(),
      updated_by: createdBy,
      deleted_at: null,
      deleted_by: null,
    };
  });

  for (let index = 0; index < rows.length; index += 50) {
    const chunk = rows.slice(index, index + 50);
    const { error } = await supabase.from('users').upsert(chunk, { onConflict: 'userid' });
    if (error) throw new Error(`Failed to upsert students: ${error.message}`);
  }

  return rows.map((row) => ({ userid: row.userid, password: STUDENT_PASSWORD }));
}

async function resetExamData(examId: string) {
  const { error: jobError } = await supabase.from('exam_submission_jobs').delete().eq('exam_id', examId);
  if (jobError && !jobError.message.includes('does not exist')) {
    throw new Error(`Failed to reset exam submission jobs: ${jobError.message}`);
  }

  const { error: submissionError } = await supabase.from('exam_submissions').delete().eq('exam_id', examId);
  if (submissionError) throw new Error(`Failed to reset exam submissions: ${submissionError.message}`);

  const { error: sessionError } = await supabase.from('exam_sessions').delete().eq('exam_id', examId);
  if (sessionError) throw new Error(`Failed to reset exam sessions: ${sessionError.message}`);
}

function writeStudentsJson(students: Array<{ userid: string; password: string }>) {
  const outputDir = resolve(__dirname, '../../load-test');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, 'students.json'), JSON.stringify(students, null, 2));
}

async function main() {
  await upsertClass();
  const subject = await findOrCreateSubject();
  const exam = await findOrCreateExam(subject.id);
  const question = await findOrCreateQuestion(exam.id);
  const students = await seedStudents();

  await resetExamData(exam.id);
  writeStudentsJson(students);

  console.log('Load test seed completed.');
  console.log('');
  console.log(`Students      : ${students.length}`);
  console.log(`Class         : ${CLASS_NAME}`);
  console.log(`Subject ID    : ${subject.id}`);
  console.log(`Exam ID       : ${exam.id}`);
  console.log(`Question ID   : ${question.id}`);
  console.log(`Students JSON : ${resolve(__dirname, '../../load-test/students.json')}`);
  console.log('');
  console.log('PowerShell env for k6:');
  console.log(`$env:EXAM_ID="${exam.id}"`);
  console.log(`$env:QUESTION_ID_1="${question.id}"`);
  console.log('$env:ANSWER_1="A"');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
