import { useEffect, useState } from 'react';
import type ExcelJS from 'exceljs';
import { getMedicines, getTransactions } from '../lib/store';
import type { Medicine, Transaction } from '../types';
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
import { TrendingUp, Package, DollarSign, ShoppingBag, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
const REPORT_HEADER_ROW = 5;
const REPORT_SHEET_COLOR = '1E3A5F';
const RUPIAH_FORMAT = '"Rp" #,##0';
const WORKBOOK_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function addReportSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  title: string,
  subtitle: string,
  headers: string[],
  widths: number[]
) {
  const worksheet = workbook.addWorksheet(name);
  const lastColumn = headers.length;

  worksheet.columns = headers.map((header, index) => ({
    header,
    key: `column${index + 1}`,
    width: widths[index],
  }));
  worksheet.mergeCells(1, 1, 1, lastColumn);
  worksheet.mergeCells(2, 1, 2, lastColumn);
  worksheet.getCell(1, 1).value = title;
  worksheet.getCell(2, 1).value = subtitle;
  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 8;
  worksheet.getRow(4).height = 8;
  worksheet.getRow(REPORT_HEADER_ROW).values = headers;

  worksheet.getCell(1, 1).font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_SHEET_COLOR } };
  worksheet.getCell(1, 1).alignment = { vertical: 'middle' };
  worksheet.getCell(2, 1).font = { name: 'Aptos', size: 10, color: { argb: 'FF64748B' }, italic: true };
  worksheet.getRow(REPORT_HEADER_ROW).height = 24;
  worksheet.getRow(REPORT_HEADER_ROW).eachCell(cell => {
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_SHEET_COLOR } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });
  worksheet.views = [{ state: 'frozen', ySplit: REPORT_HEADER_ROW }];
  worksheet.autoFilter = {
    from: { row: REPORT_HEADER_ROW, column: 1 },
    to: { row: REPORT_HEADER_ROW, column: lastColumn },
  };
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  return worksheet;
}

function styleReportRows(worksheet: ExcelJS.Worksheet) {
  for (let rowNumber = REPORT_HEADER_ROW + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    row.height = 21;
    row.eachCell(cell => {
      cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      if ((rowNumber - REPORT_HEADER_ROW) % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }
    });
  }
}

export function Reports() {
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyTransactions, setMonthlyTransactions] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
      setMedicines(medicines);
      setTransactions(transactions);

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

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const generatedAt = new Date();
      const monthLabel = format(generatedAt, 'MMMM yyyy');
      workbook.creator = 'Apotek Sehat';
      workbook.created = generatedAt;
      workbook.subject = 'Laporan penjualan dan inventori apotek';
      workbook.title = `Laporan Apotek - ${monthLabel}`;
      workbook.company = 'Apotek Sehat';

      const summarySheet = addReportSheet(
        workbook,
        'Ringkasan',
        'LAPORAN APOTEK SEHAT',
        `Ringkasan kinerja dan inventori · ${monthLabel} · Dibuat ${format(generatedAt, 'dd/MM/yyyy HH:mm')}`,
        ['Indikator', 'Nilai'],
        [38, 26]
      );
      const totalInventoryValue = medicines.reduce((sum, medicine) => sum + medicine.stock * medicine.price, 0);
      summarySheet.addRows([
        ['Penjualan bulan ini', monthlySales],
        ['Transaksi bulan ini', monthlyTransactions],
        ['Jumlah produk terdaftar', medicines.length],
        ['Nilai total inventori', totalInventoryValue],
        ['Produk dalam daftar terlaris', topProducts.length],
      ]);
      summarySheet.getCell(REPORT_HEADER_ROW + 1, 2).numFmt = RUPIAH_FORMAT;
      summarySheet.getCell(REPORT_HEADER_ROW + 4, 2).numFmt = RUPIAH_FORMAT;
      styleReportRows(summarySheet);

      const productSheet = addReportSheet(
        workbook,
        'Produk Terlaris',
        'PRODUK TERLARIS',
        '10 produk dengan pendapatan tertinggi dari seluruh transaksi',
        ['Peringkat', 'Nama obat', 'Jumlah terjual', 'Pendapatan'],
        [14, 36, 20, 24]
      );
      productSheet.addRows(topProducts.map((product, index) => [
        index + 1,
        product.name,
        product.quantity,
        product.revenue,
      ]));
      productSheet.getColumn(4).numFmt = RUPIAH_FORMAT;
      styleReportRows(productSheet);

      const stockSheet = addReportSheet(
        workbook,
        'Nilai Stok',
        'NILAI INVENTORI PER KATEGORI',
        'Ringkasan jumlah stok dan nilai inventori berdasarkan kategori obat',
        ['Kategori', 'Jumlah stok', 'Nilai inventori'],
        [34, 20, 26]
      );
      stockSheet.addRows(categoryData.map(category => [category.name, category.stock, category.value]));
      stockSheet.getColumn(3).numFmt = RUPIAH_FORMAT;
      styleReportRows(stockSheet);

      const categoryRevenueSheet = addReportSheet(
        workbook,
        'Pendapatan Kategori',
        'PENDAPATAN PER KATEGORI',
        'Pendapatan kategori berdasarkan seluruh transaksi yang tercatat',
        ['Kategori', 'Pendapatan'],
        [36, 26]
      );
      categoryRevenueSheet.addRows(revenueByCategory.map(category => [category.name, category.value]));
      categoryRevenueSheet.getColumn(2).numFmt = RUPIAH_FORMAT;
      styleReportRows(categoryRevenueSheet);

      const transactionSheet = addReportSheet(
        workbook,
        'Rincian Transaksi',
        'RINCIAN TRANSAKSI',
        'Daftar transaksi lengkap beserta ringkasan item',
        ['Tanggal', 'ID transaksi', 'Pelanggan', 'Metode pembayaran', 'Jumlah item', 'Total transaksi', 'Rincian item'],
        [22, 38, 26, 22, 16, 24, 60]
      );
      transactionSheet.addRows(transactions.map(transaction => [
        new Date(transaction.date),
        transaction.id,
        transaction.customerName || 'Umum',
        transaction.paymentMethod,
        transaction.items.reduce((count, item) => count + item.quantity, 0),
        transaction.total,
        transaction.items.map(item => `${item.medicineName} (${item.quantity} x Rp ${item.price.toLocaleString('id-ID')})`).join(', '),
      ]));
      transactionSheet.getColumn(1).numFmt = 'dd mmm yyyy, hh:mm';
      transactionSheet.getColumn(6).numFmt = RUPIAH_FORMAT;
      styleReportRows(transactionSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(buffer)], { type: WORKBOOK_MIME_TYPE });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-apotek-${format(generatedAt, 'yyyy-MM')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Laporan Excel berhasil diunduh');
    } catch {
      toast.error('Gagal membuat file Excel. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Laporan & Analisis</h2>
          <p className="text-gray-500 mt-1">Analisis penjualan dan inventori</p>
        </div>
        <button
          type="button"
          onClick={exportExcel}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          {isExporting ? 'Menyiapkan Excel...' : 'Unduh Excel'}
          {!isExporting && <Download className="h-4 w-4" />}
        </button>
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
