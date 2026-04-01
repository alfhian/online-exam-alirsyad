// src/api/axiosConfig.js
import axios from "axios";
import Swal from "sweetalert2";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/") {
        Swal.fire({
          title: "Sesi Berakhir",
          text: "Sesi Anda telah berakhir, silakan login kembali.",
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
