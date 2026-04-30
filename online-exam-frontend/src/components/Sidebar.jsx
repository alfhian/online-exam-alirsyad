import { useState, useEffect } from "react";
import { FaSignOutAlt, FaUserCircle, FaChevronLeft, FaChevronRight, FaBars, FaTimes } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import Menus from "./Menu";
import api from "../api/axiosConfig";
import Swal from "sweetalert2";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
    // Close mobile sidebar on route change
    setIsMobileOpen(false);
    
    // Auto collapse on small screens
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname]);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : {};
  const { role, name, userid } = decoded;

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

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
    <div className="flex h-screen bg-slate-50 font-poppins relative">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out shadow-2xl flex flex-col z-40 overflow-hidden fixed lg:relative h-full border-r border-slate-800`}
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 mb-2">
          {isOpen || isMobileOpen ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight leading-tight truncate">
                  Al Irsyad
                </h3>
                <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Exam Center</p>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2">
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="h-9 w-9 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        {(isOpen || isMobileOpen) && (
          <div className="mx-4 mb-6 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <FaUserCircle className="text-3xl text-slate-400" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{name || 'User'}</p>
                <p className="text-[9px] text-slate-400 font-medium truncate uppercase tracking-wider">{role} • {userid}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu List */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
          <Menus role={role} isOpen={isOpen || isMobileOpen} currentPath={location.pathname} />
        </nav>

        {/* Footer Actions */}
        <div className="p-3 mt-auto border-t border-slate-800 space-y-1">
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-full h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-300"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <FaChevronLeft className="text-xs" /> : <FaChevronRight className="text-xs" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full h-10 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500 transition-all duration-300 group"
          >
            <FaSignOutAlt className="text-base transition-transform duration-300 group-hover:-translate-x-0.5" />
            {(isOpen || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto bg-slate-50 transition-all duration-500 relative ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Content Header Area */}
        <div className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm">
           <div className="flex items-center gap-3">
             <button 
               onClick={toggleMobileSidebar}
               className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <FaBars className="text-lg" />
             </button>
             <h2 className="text-xs font-semibold text-slate-500 capitalize truncate">
               {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard'}
             </h2>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-slate-700 leading-tight">{name}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{role}</p>
              </div>
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                <FaUserCircle className="text-lg" />
              </div>
           </div>
        </div>

        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
