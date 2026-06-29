import { useEffect, useState } from 'react';
import { getMedicines, addStockMovement, getStockMovements } from '../lib/store';
import { Medicine, StockMovement } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Minus, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
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
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';

export function Stock() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: '',
    quantity: 0,
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medsData, movData] = await Promise.all([getMedicines(), getStockMovements()]);
      setMedicines(medsData);
      setMovements(movData);
    } catch {
      toast.error('Gagal memuat data stok');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (type: 'in' | 'out') => {
    setMovementType(type);
    setFormData({ medicineId: '', quantity: 0, note: '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const medicine = medicines.find(m => m.id === formData.medicineId);
    if (!medicine) {
      toast.error('Obat tidak ditemukan');
      return;
    }

    if (movementType === 'out' && formData.quantity > medicine.stock) {
      toast.error('Jumlah melebihi stok yang tersedia');
      return;
    }

    setIsSubmitting(true);
    try {
      await addStockMovement({
        medicineId: formData.medicineId,
        medicineName: medicine.name,
        type: movementType,
        quantity: formData.quantity,
        date: new Date().toISOString(),
        note: formData.note,
      });

      toast.success(
        movementType === 'in'
          ? 'Stok berhasil ditambahkan'
          : 'Stok berhasil dikurangi'
      );
      setIsDialogOpen(false);
      await loadData();
    } catch {
      toast.error('Gagal memperbarui stok');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockMedicines = medicines.filter(m => m.stock < 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Stok</h2>
          <p className="text-gray-500 mt-1">Kelola stok masuk dan keluar obat</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog('in')} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Stok Masuk
          </Button>
          <Button onClick={() => handleOpenDialog('out')} variant="outline">
            <Minus className="h-4 w-4 mr-2" />
            Stok Keluar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Memuat data stok...</span>
        </div>
      ) : (
        <>
          {/* Low Stock Alert */}
          {lowStockMedicines.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Peringatan Stok Menipis ({lowStockMedicines.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="bg-white p-3 rounded-lg border border-orange-200"
                    >
                      <p className="font-medium text-gray-900">{medicine.name}</p>
                      <p className="text-sm text-gray-600">
                        Stok: {medicine.stock} {medicine.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Stok Saat Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Obat</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.category}</TableCell>
                      <TableCell>
                        {medicine.stock} {medicine.unit}
                      </TableCell>
                      <TableCell>
                        {medicine.stock === 0 ? (
                          <Badge variant="destructive">Habis</Badge>
                        ) : medicine.stock < 20 ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Rendah
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Aman
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{medicine.supplier}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stock Movements History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pergerakan Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Obat</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Belum ada riwayat pergerakan stok
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.slice(0, 20).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{movement.medicineName}</TableCell>
                        <TableCell>
                          {movement.type === 'in' ? (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              <Plus className="h-3 w-3 mr-1" />
                              Masuk
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              <Minus className="h-3 w-3 mr-1" />
                              Keluar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell className="text-gray-600">{movement.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'in' ? 'Tambah Stok Masuk' : 'Kurangi Stok'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medicine">Pilih Obat *</Label>
                <Select
                  value={formData.medicineId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, medicineId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih obat" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.map((medicine) => (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        {medicine.name} (Stok: {medicine.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Keterangan</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Tambahkan keterangan (opsional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {movementType === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
