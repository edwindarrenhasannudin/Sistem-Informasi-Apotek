import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'kasir';
  name: string;
}

// Login menggunakan Supabase Auth dengan email
export const login = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const meta = data.user.user_metadata as { name?: string; role?: string };
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
    name: meta.name ?? email,
  };
};

export type RegisterError = 'EMAIL_TAKEN' | 'SUCCESS' | 'ERROR';

// Register membuat user baru via Supabase Auth
export const register = async (
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'kasir'
): Promise<RegisterError> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  });

  if (error) {
    console.error('Supabase signup error:', error);
    if (error.message.toLowerCase().includes('already registered')) return 'EMAIL_TAKEN';
    return error.message as any; // kembalikan pesan error asli untuk debugging
  }
  return 'SUCCESS';
};

// Mengirimkan email reset password
export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login#recovery`,
  });
  if (error) throw error;
};

// Update password (dipanggil setelah user mengklik link di email dan otomatis masuk ke sesi pemulihan)
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata as { name?: string; role?: string };
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
    name: meta.name ?? data.user.email ?? '',
  };
};
