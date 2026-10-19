import { createClient } from '@supabase/supabase-js';

const dataMode = import.meta.env.VITE_DATA_MODE;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (dataMode && dataMode !== 'local' && dataMode !== 'supabase') {
  throw new Error('VITE_DATA_MODE harus bernilai "local" atau "supabase".');
}

export const isLocalMode = dataMode === 'local' || (!dataMode && !supabaseUrl && !supabaseAnonKey);

if (!isLocalMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi saat menggunakan Supabase.');
}

export const supabase = isLocalMode ? null : createClient(supabaseUrl!, supabaseAnonKey!);

export type Database = {
  public: {
    Tables: {
      medicines: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          stock: number;
          unit: string;
          expiry_date: string;
          supplier: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['medicines']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['medicines']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          total: number;
          payment_method: string;
          customer_name: string | null;
          cashier_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'date'> & {
          id?: string;
          date?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          medicine_id: string;
          medicine_name: string;
          quantity: number;
          price: number;
          subtotal: number;
        };
        Insert: Omit<Database['public']['Tables']['transaction_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['transaction_items']['Insert']>;
      };
      stock_movements: {
        Row: {
          id: string;
          medicine_id: string;
          medicine_name: string;
          type: 'in' | 'out';
          quantity: number;
          date: string;
          note: string | null;
        };
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'date'> & {
          id?: string;
          date?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
      };
    };
  };
};
