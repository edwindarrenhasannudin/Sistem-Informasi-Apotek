import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, Pill, Lock, User, Mail, UserPlus, ArrowLeft, CheckCircle, Send, KeyRound, ShieldCheck } from 'lucide-react';
import { login, register, sendPasswordResetEmail, updatePassword } from '../lib/auth';
import { isLocalMode } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

type Mode = 'login' | 'register' | 'forgot-password' | 'update-password';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
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
        setUser(user);
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
        if (isLocalMode) {
          setLoginEmail(regEmail.trim());
          switchMode('login');
        } else {
          setRegSuccess(true);
        }
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
      if (isLocalMode) {
        switchMode('update-password');
      } else {
        setResetSuccess(true);
      }
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
    <div className="min-h-screen flex bg-slate-50">
      
      {/* ── BAGIAN KIRI: BACKGROUND IMAGE ── */}
      <div 
        className="hidden lg:flex lg:w-[48%] xl:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-login.png')" }}
      >
        <div className="absolute inset-0 bg-slate-950/35 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/25 to-blue-950/75" />
        
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full min-h-screen">
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Apotek Sehat</h1>
              <p className="text-xs text-blue-100/80">Sistem Informasi Apotek</p>
            </div>
          </div>

          <div className="max-w-xl pb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-blue-50 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              PORTAL MANAJEMEN APOTEK
            </div>
            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Kelola apotek dengan lebih mudah dan teratur.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-50/90">
              Satu tempat untuk mengelola persediaan, transaksi, dan aktivitas apotek setiap hari.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-blue-50/90">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Akses aman untuk tim apotek Anda
            </div>
          </div>

          <p className="text-xs text-blue-100/70">© Apotek Sehat · Sistem Informasi Apotek</p>
        </div>
      </div>

      {/* ── BAGIAN KANAN: FORM ── */}
      <div className="w-full lg:w-[52%] xl:w-1/2 min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
        <div className="min-h-screen flex items-center justify-center p-5 sm:p-8 lg:p-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-9">

          {/* Header Mobile Only */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 rounded-2xl shadow-lg shadow-blue-900/15">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-gray-900">Apotek Sehat</h1>
              <p className="text-gray-500 text-xs mt-0.5">Sistem Informasi Apotek</p>
            </div>
          </div>


          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 mb-3">Selamat datang kembali</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Masuk ke akun Anda</h2>
              <p className="text-sm leading-6 text-slate-500 mb-8">Gunakan email dan kata sandi untuk melanjutkan ke sistem apotek.</p>
              {isLocalMode && (
                <p className="text-sm text-blue-800 border border-blue-100 bg-blue-50/80 rounded-xl px-4 py-3 mb-5">
                  Mode lokal aktif. Data dan akun disimpan di browser ini.
                </p>
              )}
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
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
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/70 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Kata sandi</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
                      className="text-sm text-blue-700 font-medium hover:text-blue-800 hover:underline"
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
                      className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/70 transition"
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
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-900/15 transition-all flex items-center justify-center gap-2 mt-4 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
                >
                  {loginLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : 'Masuk'}
                </button>

                <div className="text-center pt-4">
                  <span className="text-sm text-slate-500">Belum punya akun? </span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-sm text-blue-700 font-semibold hover:text-blue-800 hover:underline"
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
                {isLocalMode ? 'Buat password baru untuk akun lokal Anda.' : 'Silakan masukkan password baru untuk akun Anda.'}
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
                    {isLocalMode
                      ? 'Akun lokal Anda sudah siap digunakan. Silakan login dengan email dan password yang baru dibuat.'
                      : <>Silakan cek email <span className="font-medium text-gray-700">{regEmail}</span> untuk memverifikasi akun Anda sebelum login.</>}
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
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          aria-label={showRegConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
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
    </div>
  );
}
