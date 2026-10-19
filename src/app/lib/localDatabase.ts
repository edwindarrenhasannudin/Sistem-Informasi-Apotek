import type { Medicine, StockMovement, Transaction } from '../types';

const STORAGE_KEY = 'apotek-local-database-v1';
const AUTH_CHANGE_EVENT = 'apotek-local-auth-change';

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kasir';
  passwordSalt: string;
  passwordHash: string;
}

export interface LocalDatabase {
  medicines: Medicine[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  users: LocalUser[];
  sessionUserId: string | null;
  passwordResetEmail: string | null;
}

const initialMedicines: Medicine[] = [
  { id: crypto.randomUUID(), name: 'Paracetamol 500mg', category: 'Analgesik', price: 5000, stock: 150, unit: 'Tablet', expiryDate: '2027-12-31', supplier: 'PT Kimia Farma', description: 'Obat penurun panas dan pereda nyeri' },
  { id: crypto.randomUUID(), name: 'Amoxicillin 500mg', category: 'Antibiotik', price: 8000, stock: 100, unit: 'Kapsul', expiryDate: '2027-06-30', supplier: 'PT Kalbe Farma', description: 'Antibiotik untuk infeksi bakteri' },
  { id: crypto.randomUUID(), name: 'Antasida Tablet', category: 'Antasida', price: 3000, stock: 200, unit: 'Tablet', expiryDate: '2027-08-15', supplier: 'PT Sanbe Farma', description: 'Meredakan asam lambung' },
  { id: crypto.randomUUID(), name: 'Vitamin C 1000mg', category: 'Vitamin', price: 15000, stock: 80, unit: 'Tablet', expiryDate: '2027-10-20', supplier: 'PT Kalbe Farma', description: 'Suplemen vitamin C' },
  { id: crypto.randomUUID(), name: 'Obat Batuk Sirup', category: 'Batuk & Flu', price: 12000, stock: 60, unit: 'Botol', expiryDate: '2027-05-10', supplier: 'PT Kimia Farma', description: 'Meredakan batuk dan flu' },
];

const createDatabase = (): LocalDatabase => ({
  medicines: initialMedicines,
  transactions: [],
  stockMovements: [],
  users: [],
  sessionUserId: null,
  passwordResetEmail: null,
});

export const readLocalDatabase = (): LocalDatabase => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const database = createDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    return database;
  }

  const database: unknown = JSON.parse(stored);
  if (
    !database ||
    typeof database !== 'object' ||
    !('medicines' in database) ||
    !Array.isArray(database.medicines) ||
    !('transactions' in database) ||
    !Array.isArray(database.transactions) ||
    !('stockMovements' in database) ||
    !Array.isArray(database.stockMovements) ||
    !('users' in database) ||
    !Array.isArray(database.users)
  ) {
    throw new Error('Data lokal tidak valid. Hapus data situs untuk memulai ulang.');
  }

  return database as LocalDatabase;
};

export const writeLocalDatabase = (database: LocalDatabase): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
};

export const notifyLocalAuthChange = (): void => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const subscribeToLocalAuthChanges = (listener: () => void): (() => void) => {
  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, listener);
};
