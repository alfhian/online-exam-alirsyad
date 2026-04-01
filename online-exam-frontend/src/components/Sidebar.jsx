import { useState, useEffect } from "react";
import { FaSignOutAlt, FaUserCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import Menus from "./Menu";
import api from "../api/axiosConfig";
import Swal from "sweetalert2";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : {};
  const { role, name, userid } = decoded;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari sistem?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold'
      }
    });

    if (!confirm.isConfirmed) return;

    try {
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      await api.post("/auth/logout", {});

      localStorage.removeItem("token");
      Swal.fire({
        title: "Berhasil Keluar",
        text: "Terima kasih telah menggunakan sistem.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-3xl'
        }
      });
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-poppins">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-72" : "w-24"
        } bg-slate-900 text-slate-300 transition-all duration-500 ease-in-out shadow-2xl flex flex-col z-20 overflow-hidden relative border-r border-slate-800`}
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 mb-2">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                  Al Irsyad
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Exam Center</span>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        {isOpen && (
          <div className="mx-4 mb-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaUserCircle className="text-4xl text-slate-400" />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{name || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">{role} • {userid}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu List */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide">
          <Menus role={role} isOpen={isOpen} currentPath={location.pathname} />
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-slate-800 space-y-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-11 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-300"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full h-11 px-4 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500 transition-all duration-300 group"
          >
            <FaSignOutAlt className="text-lg transition-transform duration-300 group-hover:-translate-x-0.5" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto bg-slate-50 transition-all duration-700 relative ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Content Header Area */}
        <div className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
           <div>
             <h2 className="text-sm font-medium text-slate-500 capitalize">
               {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard'}
             </h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{name}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase">{role}</p>
              </div>
              <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                <FaUserCircle className="text-xl" />
              </div>
           </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
