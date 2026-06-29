import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from './auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata as { name?: string; role?: string; username?: string };
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          username: meta.username ?? session.user.email ?? '',
          role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
          name: meta.name ?? session.user.email ?? '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata as { name?: string; role?: string; username?: string };
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          username: meta.username ?? session.user.email ?? '',
          role: (meta.role as 'admin' | 'kasir') ?? 'kasir',
          name: meta.name ?? session.user.email ?? '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
