export const roleMenus: Record<string, string[]> = {
  SISWA: ['dashboard', 'ujian', 'exam_submissions'],
  GURU: ['dashboard', 'exam', 'subject', 'teacher_exam'],
  ADMIN: ['dashboard', 'exam', 'subject', 'user_management', 'teacher_exam'],
};

export const menus = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'FaHome',
    path: '/dashboard',
  },
  {
    name: 'ujian',
    title: 'Ujian',
    icon: 'FaClipboardList',
    path: '/student/exam',
  },
  {
    name: 'exam',
    title: 'Daftar Ujian Sekolah',
    icon: 'FaQuestionCircle',
    path: '/exam',
  },
  {
    name: 'exam_submissions',
    title: 'Hasil Ujian Siswa',
    icon: 'FaFileAlt',
    path: '/exam-submissions',
  },
  {
    name: 'teacher_exam',
    title: 'Skor Ujian',
    icon: 'FaCheckCircle',
    path: '/teacher-exam',
  },
  {
    name: 'subject',
    title: 'Mata Pelajaran',
    icon: 'FaBook',
    path: '/subjects',
  },
  {
    name: 'user_management',
    title: 'Pengelolaan Pengguna',
    icon: 'FaUsers',
    path: '/user-management',
  },
  {
    name: 'laporan',
    title: 'Laporan',
    icon: 'FaChartBar',
    path: '/laporan',
  },
];