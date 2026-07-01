import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, Pill, Lock, User, Mail, UserPlus, ArrowLeft, CheckCircle, Send, KeyRound } from 'lucide-react';
import { login, register, sendPasswordResetEmail, updatePassword } from '../lib/auth';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register' | 'forgot-password' | 'update-password';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');

  // Cek apakah ada hash #recovery (dari link email reset password)
  useEffect(() => {
    if (location.hash.includes('type=recovery') || location.hash.includes('recovery')) {
      setMode('update-password');
    }
  }, [location]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'kasir'>('kasir');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Update Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      if (user) {
        navigate('/', { replace: true });
      } else {
        setLoginError('Email atau password salah, atau email belum dikonfirmasi.');
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
    if (!regEmail.includes('@')) {
      setRegError('Email tidak valid.');
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
      const result = await register(regName.trim(), regEmail.trim(), regPassword, regRole);
      if (result === 'EMAIL_TAKEN') {
        setRegError('Email sudah digunakan, silakan login.');
      } else if (result !== 'SUCCESS') {
        setRegError(result); // Tampilkan pesan error asli
      } else {
        setRegSuccess(true);
      }
    } catch {
      setRegError('Terjadi kesalahan server.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (!resetEmail.includes('@')) {
      setResetError('Masukkan email yang valid.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail.trim());
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mengirim email reset.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');

    if (newPassword.length < 6) {
      setUpdateError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setUpdateError('Konfirmasi password tidak cocok.');
      return;
    }

    setUpdateLoading(true);
    try {
      await updatePassword(newPassword);
      setUpdateSuccess(true);
      // Hapus hash dari URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err: any) {
      setUpdateError(err.message || 'Gagal mereset password.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setLoginError('');
    setRegError('');
    setResetError('');
    setUpdateError('');
    setRegSuccess(false);
    setResetSuccess(false);
    setUpdateSuccess(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* ── BAGIAN KIRI: BACKGROUND IMAGE ── */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-login.png')" }}
      >
        <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Apotek Sehat</h1>
          </div>
          <p className="text-xl text-blue-50 max-w-lg leading-relaxed">
            Sistem informasi manajemen apotek terpadu untuk pelayanan yang lebih cepat dan akurat.
          </p>
        </div>
      </div>

      {/* ── BAGIAN KANAN: FORM ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Header Mobile Only */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Apotek Sehat</h1>
            <p className="text-gray-500 text-sm mt-1">Sistem Informasi Apotek</p>
          </div>


          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang 👋</h2>
              <p className="text-gray-500 mb-8">Silakan masuk menggunakan email Anda.</p>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      Lupa password?
                    </button>
                  </div>
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
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loginLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : 'Masuk'}
                </button>

                <div className="text-center pt-4">
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
            </div>
          )}


          {/* ── FORGOT PASSWORD FORM ── */}
          {mode === 'forgot-password' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Kembali ke Login</span>
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
              <p className="text-gray-500 mb-8">
                Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
              </p>

              {resetSuccess ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Tautan Terkirim!</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Silakan periksa kotak masuk email <span className="font-medium text-gray-900">{resetEmail}</span>.
                  </p>
                  <button
                    onClick={() => switchMode('login')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Kirim Tautan Reset'}
                  </button>
                </form>
              )}
            </div>
          )}


          {/* ── UPDATE PASSWORD FORM (Dari link email) ── */}
          {mode === 'update-password' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Password Baru</h2>
              <p className="text-gray-500 mb-8">
                Silakan masukkan password baru untuk akun Anda.
              </p>

              {updateSuccess ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Berhasil!</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Password Anda telah berhasil diperbarui.
                  </p>
                  <button
                    onClick={() => switchMode('login')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showRegConfirm ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi password"
                        required
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                      />
                    </div>
                  </div>

                  {updateError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                      {updateError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {updateLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Simpan Password'}
                  </button>
                </form>
              )}
            </div>
          )}


          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              {regSuccess ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
                  <p className="text-sm text-gray-500 mb-8">
                    Silakan cek email <span className="font-medium text-gray-700">{regEmail}</span> untuk memverifikasi akun Anda sebelum login.
                  </p>
                  <button
                    onClick={() => {
                      setLoginEmail(regEmail);
                      switchMode('login');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Lanjut ke Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-gray-400 hover:text-gray-800 transition bg-gray-50 p-2 rounded-full"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Buat Akun</h2>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Nama */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="Budi Santoso"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="email@contoh.com"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Peran</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['admin', 'kasir'] as const).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRegRole(r)}
                            className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                              regRole === r
                                ? 'bg-blue-50 text-blue-700 border-blue-600'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
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
                          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                        />
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
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-6"
                    >
                      {regLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Mendaftarkan...
                        </>
                      ) : 'Buat Akun'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
