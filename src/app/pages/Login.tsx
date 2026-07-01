import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Pill, Lock, User, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { login, register } from '../lib/auth';

type Mode = 'login' | 'register';

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'kasir'>('kasir');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const user = await login(loginUsername, loginPassword);
      if (user) {
        navigate('/', { replace: true });
      } else {
        setLoginError('Username atau password salah.');
      }
    } catch {
      setLoginError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regName.trim().length < 2) {
      setRegError('Nama lengkap minimal 2 karakter.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setRegError('Username minimal 3 karakter.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    setRegLoading(true);
    try {
      const result = await register(regName.trim(), regUsername.trim(), regPassword, regRole);
      if (result === 'USERNAME_TAKEN') {
        setRegError('Username sudah digunakan, coba yang lain.');
      } else if (result !== 'SUCCESS') {
        setRegError(result); // Tampilkan pesan error asli dari Supabase
      } else {
        setRegSuccess(true);
      }
    } catch {
      setRegError('Terjadi kesalahan server.');
    } finally {
      setRegLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setLoginError('');
    setRegError('');
    setRegSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Apotek Sehat</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem Informasi Apotek</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Masuk ke Sistem</h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="Masukkan username"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : 'Masuk'}
                </button>

                <div className="text-center pt-1">
                  <span className="text-sm text-gray-500">Belum punya akun? </span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Buat akun baru
                  </button>
                </div>
              </form>

              {/* Supabase info hint */}
              <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                <p className="font-semibold mb-1">Info:</p>
                <p>Gunakan username dan password yang telah terdaftar, atau buat akun baru.</p>
              </div>
            </>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && !regSuccess && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-800">Buat Akun Baru</h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserPlus className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Nama lengkap"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="Buat username unik"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['admin', 'kasir'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegRole(r)}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                          regRole === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {r === 'admin' ? 'Administrator' : 'Kasir'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      placeholder="Ulangi password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {regError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
                >
                  {regLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : 'Buat Akun'}
                </button>

                <div className="text-center">
                  <span className="text-sm text-gray-500">Sudah punya akun? </span>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Masuk di sini
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── REGISTER SUCCESS ── */}
          {mode === 'register' && regSuccess && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Akun Berhasil Dibuat!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Akun <span className="font-medium text-gray-700">{regUsername}</span> sudah siap digunakan.
              </p>
              <button
                onClick={() => {
                  setLoginUsername(regUsername);
                  switchMode('login');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Masuk Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
