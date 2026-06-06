// src/api/axiosConfig.js
import axios from "axios";
import Swal from "sweetalert2";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const isLoginRequest = (config = {}) => {
  const requestUrl = String(config.url || "");
  return requestUrl.includes("/auth/login");
};

const getFriendlyErrorMessage = (status, config, error) => {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "Koneksi terlalu lama. Jawaban mungkin belum terkonfirmasi, silakan coba kirim lagi.";
  }
  if (status === 400) return "Data belum sesuai. Silakan periksa kembali isian Anda.";
  if (status === 401 && isLoginRequest(config)) return "ID Pengguna atau Kata Sandi salah.";
  if (status === 401) return "Sesi Anda telah berakhir. Silakan login kembali.";
  if (status === 403) return "Anda tidak memiliki akses untuk melakukan aksi ini.";
  if (status === 404) return "Data yang diminta tidak ditemukan.";
  if (status === 409) return "Data sudah ada atau sedang digunakan.";
  if (status === 413) return "Ukuran data terlalu besar. Silakan kecilkan file atau konten yang diunggah.";
  if (status === 422) return "Data belum valid. Silakan periksa kembali isian Anda.";
  if (status >= 500) return "Terjadi gangguan pada server. Silakan coba beberapa saat lagi.";
  if (!status) return "Koneksi ke server bermasalah. Silakan periksa jaringan lalu coba kembali.";
  return "Proses gagal. Silakan coba kembali.";
};

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const friendlyMessage = getFriendlyErrorMessage(status, error.config, error);

    if (error.response) {
      error.response.data = {
        ...(error.response.data || {}),
        message: friendlyMessage,
        error: friendlyMessage,
      };
    }
    error.userMessage = friendlyMessage;
    error.message = friendlyMessage;

    if (status === 401 && !isLoginRequest(error.config)) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/") {
        Swal.fire({
          title: "Sesi Berakhir",
          text: friendlyMessage,
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = "/";
        });
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
