
  # Sistem Informasi Apotek

  This is a code bundle for Sistem Informasi Apotek. The original project is available at https://www.figma.com/design/NtuiOlOdzmqyPC7ldBV16g/Sistem-Informasi-Apotek.

  ## Menjalankan secara lokal

  Proyek ini dapat berjalan tanpa koneksi Supabase. Mode lokal menyimpan akun dan
  data apotek di penyimpanan browser (localStorage) pada browser yang digunakan.
  Buat akun lewat tombol **Buat akun baru** di halaman login; akun pertama diberi
  peran **Kasir** secara default.

  File `.env.local` mengatur `VITE_DATA_MODE=local`, sehingga konfigurasi Supabase
  pada `.env` tidak digunakan. File tersebut tidak disertakan di Git.

  Install dependencies with `npm install`, lalu jalankan `npm run dev`.

  Buka alamat lokal yang ditampilkan Vite (biasanya http://localhost:5173).
  Data lokal hanya ada di browser/perangkat tersebut. Menghapus data situs browser
  akan menghapus akun dan data lokal.

  Untuk menggunakan Supabase lagi, hapus `.env.local` atau ubah nilainya menjadi
  `VITE_DATA_MODE=supabase`, lalu isi `VITE_SUPABASE_URL` dan
  `VITE_SUPABASE_ANON_KEY` pada file environment lokal.
  