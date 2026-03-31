import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSelect from '../components/DropdownRole';
import axios from 'axios';

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

		setLoading(true);
		setError(''); // Reset error message
    
		if (!name || !role || !password) {
			setError('Silakan isi semua field!');
			return;
		}

		const userid = nis || nik;

		try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
				name,
        userid,
        password,
				role,
      });

      console.log(res.data);

			const login = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        userid,
        password,
      });

			const token = login.data.access_token;
      localStorage.setItem('token', token); // atau simpan di cookie
      setLoading(false);
      console.log('Login berhasil:', res.data);
      navigate('/dashboard'); // Redirect ke halaman dashboard setelah register dan login sukses
    } catch (err) {
      console.error('Registrasi gagal:', err);
      setError(err.response?.data?.message || 'Registrasi gagal, silakan coba lagi.');
      setLoading(false);
    }
  };

	const handleLogin = () => {
		navigate('/');
	}

  return (
    <div className='grid grid-cols-2'>
      <div style={{ backgroundImage: "url('/img/login-background-small.png')" }} className='hidden md:block h-screen bg-cover bg-center'>
      </div>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-12">
            <h3 className='text-xl font-bold text-neutral-600'>Register</h3>
          </div>
					<div>
						{error && <div className="text-red-500 mb-4">{error}</div>}
					</div>
          <div className='mb-8'>
            {/* <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-4 text-gray-500 font-medium whitespace-nowrap">Akses Siswa</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div> */}
            <form onSubmit={handleRegister}>
              <input 
                type="text"
                placeholder="Name"
                className="w-full py-2 px-5 bg-white rounded-full mb-5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className='mb-5'>
                <RoleSelect role={role} setRole={setRole} />
              </div>
							<input 
								type="text"
								placeholder="NIS"
								className={`w-full py-2 px-5 bg-white rounded-full mb-5 ${role === 'SISWA' ? '' : ' hidden'}`}
								value={nis}
								onChange={(e) => setNis(e.target.value)}
							/>
							<input 
								type="text"
								placeholder="NIK"
								className={`w-full py-2 px-5 bg-white rounded-full mb-5 ${role !== 'SISWA' && role !== null ? '' : ' hidden'}`}
								value={nik}
								onChange={(e) => setNik(e.target.value)}
							/>
              <input
                type="password"
                placeholder="Password"
                className="w-full py-2 px-5 bg-white rounded-full mb-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
							<div className='mb-3'>
								<span className='ps-2 text-gray-500 font-medium whitespace-nowrap'>Sudah punya akun? <span className='text-blue-500 cursor-pointer' onClick={handleLogin}>Sign in</span></span>
							</div>
              <div className='flex justify-center'>
                <button 
                  className={`bg-green-500 w-[150px] text-white py-2 px-4 rounded-full hover:bg-emerald-300 transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  type="submit"
                >
									{loading ? 'Loading...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
