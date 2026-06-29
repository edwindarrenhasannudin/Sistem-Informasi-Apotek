import { useEffect, useState } from 'react';
import { getMedicines, addTransaction, getTransactions } from '../lib/store';
import { Medicine, TransactionItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { format } from 'date-fns';

export function Transactions() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medsData, txData] = await Promise.all([getMedicines(), getTransactions()]);
      setMedicines(medsData);
      setTransactions(txData);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedMedicineId) {
      toast.error('Pilih obat terlebih dahulu');
      return;
    }

    const medicine = medicines.find(m => m.id === selectedMedicineId);
    if (!medicine) return;

    if (quantity > medicine.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }

    const existingItem = cart.find(item => item.medicineId === selectedMedicineId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.medicineId === selectedMedicineId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.price,
            }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          quantity,
          price: medicine.price,
          subtotal: quantity * medicine.price,
        },
      ]);
    }

    setSelectedMedicineId('');
    setQuantity(1);
    toast.success('Item ditambahkan ke keranjang');
  };

  const handleRemoveFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setIsCheckingOut(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      await addTransaction({
        date: new Date().toISOString(),
        items: cart,
        total,
        paymentMethod,
        customerName: customerName || undefined,
      });

      toast.success('Transaksi berhasil');
      setCart([]);
      setCustomerName('');
      setPaymentMethod('Tunai');
      await loadData();
    } catch {
      toast.error('Gagal memproses transaksi');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Transaksi Penjualan</h2>
        <p className="text-gray-500 mt-1">Point of Sale (POS) untuk penjualan obat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Item</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Pilih Obat</Label>
                    <Select value={selectedMedicineId} onValueChange={setSelectedMedicineId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih obat" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.filter(m => m.stock > 0).map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id}>
                            {medicine.name} - Rp {medicine.price.toLocaleString('id-ID')} (Stok: {medicine.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Button onClick={handleAddToCart} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keranjang Belanja</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obat</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicineId}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.medicineId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checkout */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Customer (Opsional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama customer"
                />
              </div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tunai">Tunai</SelectItem>
                    <SelectItem value="Debit">Kartu Debit</SelectItem>
                    <SelectItem value="Kredit">Kartu Kredit</SelectItem>
                    <SelectItem value="Transfer">Transfer Bank</SelectItem>
                    <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Item:</span>
                  <span>{cart.length}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || isCheckingOut}
              >
                {isCheckingOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Bayar Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Belum ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        #{transaction.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{transaction.customerName || '-'}</TableCell>
                      <TableCell>{transaction.items.length} item(s)</TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rp {transaction.total.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
