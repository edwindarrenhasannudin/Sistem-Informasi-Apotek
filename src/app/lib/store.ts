import { supabase } from './supabase';
import { Medicine, Transaction, StockMovement } from '../types';

// Helper: map snake_case DB row to camelCase Medicine
const mapMedicine = (row: any): Medicine => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: Number(row.price),
  stock: Number(row.stock),
  unit: row.unit,
  expiryDate: row.expiry_date,
  supplier: row.supplier,
  description: row.description ?? undefined,
});

// Helper: map DB row to Transaction
const mapTransaction = (row: any): Transaction => ({
  id: row.id,
  date: row.date,
  total: Number(row.total),
  paymentMethod: row.payment_method,
  customerName: row.customer_name ?? undefined,
  items: (row.transaction_items ?? []).map((item: any) => ({
    medicineId: item.medicine_id,
    medicineName: item.medicine_name,
    quantity: Number(item.quantity),
    price: Number(item.price),
    subtotal: Number(item.subtotal),
  })),
});

// Helper: map DB row to StockMovement
const mapStockMovement = (row: any): StockMovement => ({
  id: row.id,
  medicineId: row.medicine_id,
  medicineName: row.medicine_name,
  type: row.type as 'in' | 'out',
  quantity: Number(row.quantity),
  date: row.date,
  note: row.note ?? undefined,
});

// ── MEDICINES ────────────────────────────────────────────────
export const getMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(mapMedicine);
};

export const addMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  const { data, error } = await supabase
    .from('medicines')
    .insert({
      name: medicine.name,
      category: medicine.category,
      price: medicine.price,
      stock: medicine.stock,
      unit: medicine.unit,
      expiry_date: medicine.expiryDate,
      supplier: medicine.supplier,
      description: medicine.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMedicine(data);
};

export const updateMedicine = async (id: string, updates: Partial<Medicine>): Promise<void> => {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.stock !== undefined) payload.stock = updates.stock;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate;
  if (updates.supplier !== undefined) payload.supplier = updates.supplier;
  if (updates.description !== undefined) payload.description = updates.description;

  const { error } = await supabase.from('medicines').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteMedicine = async (id: string): Promise<void> => {
  const { error } = await supabase.from('medicines').delete().eq('id', id);
  if (error) throw error;
};

// ── TRANSACTIONS ─────────────────────────────────────────────
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTransaction);
};

export const addTransaction = async (
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> => {
  // Insert transaction header
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .insert({
      date: transaction.date,
      total: transaction.total,
      payment_method: transaction.paymentMethod,
      customer_name: transaction.customerName ?? null,
    })
    .select()
    .single();
  if (txError) throw txError;

  // Insert transaction items
  const items = transaction.items.map(item => ({
    transaction_id: txData.id,
    medicine_id: item.medicineId,
    medicine_name: item.medicineName,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  }));
  const { error: itemsError } = await supabase.from('transaction_items').insert(items);
  if (itemsError) throw itemsError;

  // Decrease stock for each item
  for (const item of transaction.items) {
    const { data: med } = await supabase
      .from('medicines')
      .select('stock')
      .eq('id', item.medicineId)
      .single();
    if (med) {
      await supabase
        .from('medicines')
        .update({ stock: med.stock - item.quantity })
        .eq('id', item.medicineId);
    }
  }

  return {
    ...transaction,
    id: txData.id,
  };
};

// ── STOCK MOVEMENTS ──────────────────────────────────────────
export const getStockMovements = async (): Promise<StockMovement[]> => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapStockMovement);
};

export const addStockMovement = async (
  movement: Omit<StockMovement, 'id'>
): Promise<StockMovement> => {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      medicine_id: movement.medicineId,
      medicine_name: movement.medicineName,
      type: movement.type,
      quantity: movement.quantity,
      date: movement.date,
      note: movement.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Update medicine stock
  const { data: med } = await supabase
    .from('medicines')
    .select('stock')
    .eq('id', movement.medicineId)
    .single();
  if (med) {
    const newStock = movement.type === 'in'
      ? med.stock + movement.quantity
      : med.stock - movement.quantity;
    await supabase
      .from('medicines')
      .update({ stock: newStock })
      .eq('id', movement.medicineId);
  }

  return mapStockMovement(data);
};
