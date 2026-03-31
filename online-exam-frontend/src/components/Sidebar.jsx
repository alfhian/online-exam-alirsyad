import { useState, useEffect } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import Menus from "./Menu";
import axios from "axios";
import Swal from "sweetalert2";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : {};
  const role = decoded.role;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: "Yakin ingin logout?",
      text: "Sesi Anda akan berakhir dan perlu login ulang.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return; // user menekan "Batal"

    try {
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem("token");
      await Swal.fire({
        title: "Logout Berhasil",
        text: "Anda telah keluar dari sistem.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      Swal.fire("Gagal", "Terjadi kesalahan saat logout", "error");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } bg-gray-900 text-gray-100 transition-all duration-500 ease-in-out shadow-xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {isOpen && (
            <h3 className="text-xl font-semibold tracking-wide text-emerald-400">
              Dashboard
            </h3>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Toggle Sidebar"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>

        {/* Menu List */}
        <nav className="flex-1 overflow-y-auto mt-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <Menus role={role} isOpen={isOpen} currentPath={location.pathname} />
        </nav>

        {/* Logout Button */}
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 mt-auto text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <FaSignOutAlt className="text-lg" />
          {isOpen && <span>Logout</span>}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
