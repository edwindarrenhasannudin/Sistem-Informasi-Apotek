export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  expiryDate: string;
  supplier: string;
  description?: string;
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
}

export interface TransactionItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  note?: string;
}
