import { isLocalMode, supabase } from './supabase';
import {
  notifyLocalAuthChange,
  readLocalDatabase,
  writeLocalDatabase,
} from './localDatabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'kasir';
  name: string;
}

// Login menggunakan Supabase Auth dengan email
export const login = async (email: string, password: string): Promise<User | null> => {
  if (isLocalMode) {
    const database = readLocalDatabase();
    const account = database.users.find(user => user.email === email.trim().toLowerCase());
    if (!account || !(await verifyPassword(password, account.passwordSalt, account.passwordHash))) return null;
    database.sessionUserId = account.id;
    writeLocalDatabase(database);
    notifyLocalAuthChange();
    return toUser(account);
  }

  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
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
  if (isLocalMode) {
    const database = readLocalDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    if (database.users.some(user => user.email === normalizedEmail)) return 'EMAIL_TAKEN';
    const passwordSalt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(password, passwordSalt);
    database.users.push({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name,
      role,
      passwordSalt,
      passwordHash,
    });
    writeLocalDatabase(database);
    return 'SUCCESS';
  }

  const { error } = await supabase!.auth.signUp({
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
  if (isLocalMode) {
    const database = readLocalDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!database.users.some(user => user.email === normalizedEmail)) {
      throw new Error('Akun dengan email tersebut tidak ditemukan.');
    }
    database.passwordResetEmail = normalizedEmail;
    writeLocalDatabase(database);
    return;
  }

  const { error } = await supabase!.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login#recovery`,
  });
  if (error) throw error;
};

// Update password (dipanggil setelah user mengklik link di email dan otomatis masuk ke sesi pemulihan)
export const updatePassword = async (newPassword: string) => {
  if (isLocalMode) {
    const database = readLocalDatabase();
    const account = database.users.find(user => user.email === database.passwordResetEmail);
    if (!account) throw new Error('Silakan mulai ulang proses lupa password.');
    account.passwordSalt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
    account.passwordHash = await hashPassword(newPassword, account.passwordSalt);
    database.passwordResetEmail = null;
    writeLocalDatabase(database);
    return;
  }

  const { error } = await supabase!.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const logout = async () => {
  if (isLocalMode) {
    const database = readLocalDatabase();
    database.sessionUserId = null;
    writeLocalDatabase(database);
    notifyLocalAuthChange();
    return;
  }
  await supabase!.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (isLocalMode) {
    const database = readLocalDatabase();
    const account = database.users.find(user => user.id === database.sessionUserId);
    return account ? toUser(account) : null;
  }
  const { data } = await supabase!.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata as { name?: string; role?: string };
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
    name: meta.name ?? data.user.email ?? '',
  };
};

const toUser = (account: { id: string; email: string; name: string; role: 'admin' | 'kasir' }): User => ({
  id: account.id,
  email: account.email,
  name: account.name,
  role: account.role,
});

const toBase64 = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(atob(salt), char => char.charCodeAt(0)), iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );
  return toBase64(new Uint8Array(hash));
};

const verifyPassword = async (password: string, salt: string, expectedHash: string): Promise<boolean> =>
  (await hashPassword(password, salt)) === expectedHash;
