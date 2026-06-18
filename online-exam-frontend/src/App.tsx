import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./routes/ProtectedRoutes";
import { startVideoUploadQueue } from "./utils/backgroundVideoUpload";

// Importing the pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import Users from "./pages/Users.jsx";
import Exam from "./pages/Exam.jsx";
import StudentExam from "./pages/StudentExam.jsx";
import SubmittedExam from "./pages/SubmittedExam.jsx";
import SubmittedExamDetail from "./pages/SubmittedExamDetail.jsx";
import StudentExamPage from "./pages/StudentExamPage.jsx";
import TeacherExam from "./pages/TeacherExam.jsx";
import TeacherExamStudents from "./pages/TeacherExamStudents.jsx";
import TeacherExamScoring from "./pages/TeacherExamScoring.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Subject from "./pages/Subject.jsx";
import Reports from "./pages/Reports.jsx";
import Classes from "./pages/Classes.jsx";

function App() {
  useEffect(() => {
    startVideoUploadQueue();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Users />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <Exam />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId/questionnaire"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <Questionnaire />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <Subject />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan/:reportType"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exam"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exam/:examId"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <StudentExamPage />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam-submissions"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <SubmittedExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam-submissions/:submissionId"
          element={
            <ProtectedRoute allowedRoles={["SISWA"]}>
              <SubmittedExamDetail />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <TeacherExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam/:examId/students"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <TeacherExamStudents />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam/submission/:submissionId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GURU"]}>
              <TeacherExamScoring />  
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
