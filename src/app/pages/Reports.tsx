import { useEffect, useState } from 'react';
import { getMedicines, getTransactions } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Package, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function Reports() {
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyTransactions, setMonthlyTransactions] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [medicines, transactions] = await Promise.all([
        getMedicines(),
        getTransactions(),
      ]);

      // Current month range
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Filter transactions for current month
      const monthlyTrans = transactions.filter(t =>
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );

      // Monthly sales
      const sales = monthlyTrans.reduce((sum, t) => sum + t.total, 0);
      setMonthlySales(sales);
      setMonthlyTransactions(monthlyTrans.length);

      // Top selling products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      transactions.forEach(t => {
        t.items.forEach((item: any) => {
          if (!productSales[item.medicineId]) {
            productSales[item.medicineId] = {
              name: item.medicineName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.medicineId].quantity += item.quantity;
          productSales[item.medicineId].revenue += item.subtotal;
        });
      });

      const top = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setTopProducts(top);

      // Category analysis
      const categoryStats: Record<string, { stock: number; value: number }> = {};
      medicines.forEach(m => {
        if (!categoryStats[m.category]) {
          categoryStats[m.category] = { stock: 0, value: 0 };
        }
        categoryStats[m.category].stock += m.stock;
        categoryStats[m.category].value += m.stock * m.price;
      });

      const catData = Object.entries(categoryStats).map(([name, data]) => ({
        name,
        stock: data.stock,
        value: data.value,
      }));
      setCategoryData(catData);

      // Revenue by category
      const categoryRevenue: Record<string, number> = {};
      transactions.forEach(t => {
        t.items.forEach((item: any) => {
          const medicine = medicines.find(m => m.id === item.medicineId);
          if (medicine) {
            if (!categoryRevenue[medicine.category]) {
              categoryRevenue[medicine.category] = 0;
            }
            categoryRevenue[medicine.category] += item.subtotal;
          }
        });
      });

      const revData = Object.entries(categoryRevenue).map(([name, value]) => ({
        name,
        value,
      }));
      setRevenueByCategory(revData);
    } catch {
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500 text-lg">Memuat laporan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Laporan & Analisis</h2>
        <p className="text-gray-500 mt-1">Analisis penjualan dan inventori</p>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Penjualan Bulan Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {monthlySales.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transaksi Bulan Ini
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyTransactions}</div>
            <p className="text-xs text-gray-500 mt-1">Total transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Produk Terlaris (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Terjual</TableHead>
                <TableHead>Pendapatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    Belum ada data penjualan
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.quantity} unit</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      Rp {product.revenue.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Belum ada data penjualan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Nilai Stok per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                  />
                  <Bar dataKey="value" fill="#3b82f6" name="Nilai Stok" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Belum ada data stok
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detail Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Total Stok</TableHead>
                <TableHead>Nilai Inventori</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map((cat, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.stock} unit</TableCell>
                  <TableCell className="font-semibold">
                    Rp {cat.value.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
