import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSelect from '../components/DropdownRole';
import api from '../api/axiosConfig';
import { FaUser, FaLock, FaIdCard, FaArrowRight, FaChevronLeft } from "react-icons/fa";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Register = () => {
	const [name, setName] = useState('');
	const [role, setRole] = useState(null);
	const [nis, setNis] = useState('');
	const [nik, setNik] = useState('');
	const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
		setError('');

		if (!name || !role || !password) {
			setError('Silakan isi semua field yang wajib!');
			return;
		}

		const userid = role === 'SISWA' ? nis : nik;
    if (!userid) {
      setError(`Silakan isi ${role === 'SISWA' ? 'NIS' : 'NIK'} Anda!`);
      return;
    }

    setLoading(true);

		try {
      await api.post('/auth/register', {
				name,
        userid,
        password,
				role,
      });

      setLoading(false);
      MySwal.fire({
        title: "Registrasi Berhasil!",
        text: "Akun Anda telah didaftarkan. Silakan hubungi admin untuk validasi agar dapat login.",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        navigate('/'); // Redirect ke halaman login
      });
    } catch (err) {
      console.error('Registrasi gagal:', err);
      setError(err.response?.data?.message || 'Registrasi gagal, silakan coba lagi.');
      setLoading(false);
    }
  };

	const handleLogin = () => navigate('/');

  return (
    <div className="flex min-h-screen bg-slate-50 font-poppins overflow-hidden">
      {/* Visual Section - Matches Login */}
      <div className="hidden lg:flex lg:w-3/5 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/img/login-background.png" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            alt="Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/80 to-emerald-500/20"></div>
        </div>
        
        <div className="relative z-10 max-w-xl text-white">
          <div className="h-16 w-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl mb-8">
            <span className="text-3xl font-black">A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">
            Mulai Perjalanan <br />
            <span className="text-emerald-400">Akademik Anda</span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed font-medium">
            Daftarkan diri Anda untuk mengakses sistem ujian online SMK Al Irsyad yang transparan dan aman.
          </p>
          
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-black text-white">Versi 2.0</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Terbaru</p>
            </div>
            <div className="h-12 w-px bg-slate-700"></div>
            <div>
              <p className="text-3xl font-black text-white">Secure</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Data Terproteksi</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-8 sm:p-12 md:p-16 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="lg:hidden mb-8 flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-white font-black">A</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Al Irsyad</h2>
          </div>

          <div className="mb-8">
            <div 
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 cursor-pointer mb-4 font-bold text-sm transition-colors group"
              onClick={handleLogin}
            >
              <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              Kembali ke Login
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Akun Baru</h2>
            <p className="text-slate-500 mt-2 font-medium">Lengkapi data diri Anda untuk membuat akun.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 mb-6 rounded-xl animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500 text-slate-400">
                  <FaUser className="text-lg" />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full py-3.5 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Pilih Peran</label>
              <div className="relative group">
                <RoleSelect role={role} setRole={setRole} />
              </div>
            </div>

            {/* NIS (Siswa Only) */}
            {role === 'SISWA' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Nomor Induk Siswa (NIS)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500 text-slate-400">
                    <FaIdCard className="text-lg" />
                  </div>
                  <input
                    type="text"
                    placeholder="Masukkan NIS"
                    className="w-full py-3.5 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* NIK (Non-Siswa Only) */}
            {role && role !== 'SISWA' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Nomor Induk Kependudukan (NIK)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500 text-slate-400">
                    <FaIdCard className="text-lg" />
                  </div>
                  <input
                    type="text"
                    placeholder="Masukkan NIK"
                    className="w-full py-3.5 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500 text-slate-400">
                  <FaLock className="text-lg" />
                </div>
                <input
                  type="password"
                  placeholder="Buat Password Kuat"
                  className="w-full py-3.5 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-300 flex items-center justify-center gap-3 active:scale-[0.98] mt-4 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <div className="h-6 w-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Daftar Sekarang
                  <FaArrowRight className="text-sm" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pb-8">
            <p className="text-slate-500 font-bold">
              Sudah memiliki akun?{" "}
              <span
                className="text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors"
                onClick={handleLogin}
              >
                Sign In di sini
              </span>
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 text-center w-full hidden md:block">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
             © {new Date().getFullYear()} Al Irsyad Exam System — Versi 2.0
           </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
