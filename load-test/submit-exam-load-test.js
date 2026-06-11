import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const students = new SharedArray("students", () =>
  JSON.parse(open("./students.json"))
);

export const options = {
  scenarios: {
    submit_exam: {
      executor: "per-vu-iterations",
      vus: Number(__ENV.VUS || 10),
      iterations: 1,
      maxDuration: "5m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

const API_BASE_URL = __ENV.API_BASE_URL;
const EXAM_ID = __ENV.EXAM_ID;
const QUESTION_ID_1 = __ENV.QUESTION_ID_1;
const ANSWER_1 = __ENV.ANSWER_1 || "A";

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function requireEnv(name, value) {
  if (!value) throw new Error(`${name} env is required`);
}

function login(student) {
  const res = http.post(
    `${API_BASE_URL}/auth/login`,
    JSON.stringify({
      userid: student.userid,
      password: student.password,
    }),
    {
      headers: jsonHeaders(),
      timeout: "30s",
      tags: { name: "login" },
    }
  );

  check(res, {
    "login status 200": (r) => r.status === 200,
    "login token exists": (r) => Boolean(r.json("access_token")),
  });

  return res.json("access_token");
}

function startSession(token) {
  const res = http.post(
    `${API_BASE_URL}/exam-sessions/${EXAM_ID}/start`,
    JSON.stringify({}),
    {
      headers: jsonHeaders(token),
      timeout: "30s",
      tags: { name: "start_session" },
    }
  );

  check(res, {
    "start session status ok": (r) => r.status === 200 || r.status === 201,
    "session id exists": (r) => Boolean(r.json("id")),
  });

  return res.json("id");
}

function submitExam(token, sessionId) {
  const res = http.post(
    `${API_BASE_URL}/exam-submissions/${EXAM_ID}`,
    JSON.stringify({
      sessionId,
      answers: [
        {
          question_id: QUESTION_ID_1,
          answer: ANSWER_1,
        },
      ],
    }),
    {
      headers: jsonHeaders(token),
      timeout: "30s",
      tags: { name: "submit_exam" },
    }
  );

  check(res, {
    "submit status ok": (r) => r.status === 200 || r.status === 201,
    "submit id exists": (r) => Boolean(r.json("id")),
  });

  return res;
}

export function setup() {
  requireEnv("API_BASE_URL", API_BASE_URL);
  requireEnv("EXAM_ID", EXAM_ID);
  requireEnv("QUESTION_ID_1", QUESTION_ID_1);
  if (Number(__ENV.VUS || 10) > students.length) {
    throw new Error(`VUS is greater than students.json rows (${students.length})`);
  }
}

export default function () {
  const student = students[__VU - 1];

  if (!student) {
    console.error(`Student data not found for VU ${__VU}`);
    return;
  }

  const token = login(student);
  if (!token) return;

  const sessionId = startSession(token);
  if (!sessionId) return;

  sleep(Math.random() * 2);

  const submitRes = submitExam(token, sessionId);
  console.log(
    JSON.stringify({
      vu: __VU,
      userid: student.userid,
      status: submitRes.status,
    })
  );
}
