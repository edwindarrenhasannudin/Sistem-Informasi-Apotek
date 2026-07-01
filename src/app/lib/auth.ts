import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'kasir';
  name: string;
}

// Login menggunakan Supabase Auth (email = username@apotek.local)
export const login = async (username: string, password: string): Promise<User | null> => {
  const email = `${username.trim().toLowerCase()}@apotek.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const meta = data.user.user_metadata as { name?: string; role?: string; username?: string };
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    username: meta.username ?? username,
    role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
    name: meta.name ?? username,
  };
};

export type RegisterError = 'USERNAME_TAKEN' | 'SUCCESS' | 'ERROR';

// Register membuat user baru via Supabase Auth
export const register = async (
  name: string,
  username: string,
  password: string,
  role: 'admin' | 'kasir'
): Promise<RegisterError> => {
  const email = `${username.trim().toLowerCase()}@apotek.com`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username: username.trim().toLowerCase(), role },
    },
  });

  if (error) {
    console.error('Supabase signup error:', error);
    if (error.message.toLowerCase().includes('already registered')) return 'USERNAME_TAKEN';
    return error.message as any; // return exact error message for debugging
  }
  return 'SUCCESS';
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata as { name?: string; role?: string; username?: string };
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    username: meta.username ?? data.user.email ?? '',
    role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
    name: meta.name ?? data.user.email ?? '',
  };
};
