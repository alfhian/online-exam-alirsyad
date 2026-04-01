import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoutes";

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

function App() {
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
            <ProtectedRoute>
              <Users />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <Exam />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId/questionnaire"
          element={
            <ProtectedRoute>
              <Questionnaire />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Subject />  
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exam"
          element={
            <ProtectedRoute>
              <StudentExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exam/:examId"
          element={
            <ProtectedRoute>
              <StudentExamPage />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam-submissions"
          element={
            <ProtectedRoute>
              <SubmittedExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam-submissions/:submissionId"
          element={
            <ProtectedRoute>
              <SubmittedExamDetail />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam"
          element={
            <ProtectedRoute>
              <TeacherExam />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam/:examId/students"
          element={
            <ProtectedRoute>
              <TeacherExamStudents />  
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-exam/submission/:submissionId"
          element={
            <ProtectedRoute>
              <TeacherExamScoring />  
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
