-- ============================================================
-- SCHEMA: Sistem Informasi Apotek
-- Jalankan di: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Tabel medicines
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  supplier TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ DEFAULT NOW(),
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  customer_name TEXT,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel transaction_items
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- 4. Tabel stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can do everything
CREATE POLICY "medicines_authenticated" ON medicines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "transactions_authenticated" ON transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "transaction_items_authenticated" ON transaction_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "stock_movements_authenticated" ON stock_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA: 5 obat awal
-- ============================================================
INSERT INTO medicines (name, category, price, stock, unit, expiry_date, supplier, description)
VALUES
  ('Paracetamol 500mg', 'Analgesik', 5000, 150, 'Tablet', '2027-12-31', 'PT Kimia Farma', 'Obat penurun panas dan pereda nyeri'),
  ('Amoxicillin 500mg', 'Antibiotik', 8000, 100, 'Kapsul', '2027-06-30', 'PT Kalbe Farma', 'Antibiotik untuk infeksi bakteri'),
  ('Antasida Tablet', 'Antasida', 3000, 200, 'Tablet', '2027-08-15', 'PT Sanbe Farma', 'Meredakan asam lambung'),
  ('Vitamin C 1000mg', 'Vitamin', 15000, 80, 'Tablet', '2027-10-20', 'PT Kalbe Farma', 'Suplemen vitamin C'),
  ('Obat Batuk Sirup', 'Batuk & Flu', 12000, 60, 'Botol', '2027-05-10', 'PT Kimia Farma', 'Meredakan batuk dan flu')
ON CONFLICT DO NOTHING;
