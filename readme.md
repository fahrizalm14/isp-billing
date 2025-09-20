# ISP Billing System

**ISP Billing System** adalah aplikasi manajemen pelanggan dan tagihan untuk penyedia layanan internet (ISP). Aplikasi ini membantu mengelola pengguna, paket internet, router, Optical Distribution Point (ODP), langganan, pembayaran, hingga monitoring bandwidth dalam satu dashboard modern dan responsif.

---

## ✅ Progress Fitur

### 📊 Dashboard

* [ ] Ringkasan pendapatan bulanan
* [ ] Jumlah langganan aktif
* [ ] Jumlah tagihan belum dibayar
* [ ] Total pengguna
* [ ] Paket terpopuler bulan ini
* [x] Monitoring bandwidth real-time per interface (RX/TX)
* [ ] Statistik pemakaian dengan grafik interaktif

---

### 🌐 Router Management & Bandwidth Monitoring

* [x] Manajemen daftar router (nama, deskripsi, IP, port, status, terakhir diperbarui)
* [x] Monitoring status router (online/offline)

---

### 🛰️ Optical Distribution Point (ODP)

* [x] Manajemen daftar ODP (nama, lokasi, wilayah, kapasitas port)
* [ ] Monitoring penggunaan port ODP
* [x] Pemetaan lokasi ODP dengan integrasi peta interaktif

---

### 👥 Manajemen Pengguna

* [x] Tambah, edit, dan hapus akun pengguna sistem
* [x] Role hanya untuk pengelola (admin/operator)
* [x] Tidak ada integrasi langsung dengan data langganan pelanggan

---

### 📦 Paket Internet

* [x] Manajemen paket internet (nama paket, deskripsi, router, pool, rate limit, harga)
* [x] Setiap kali menambahkan paket internet, sistem otomatis membuat profile PPPoE di Mikrotik
* [x] Saat menghapus paket internet, profile PPPoE di Mikrotik juga ikut dihapus
* [x] Nama paket/profile PPPoE tidak dapat diubah setelah dibuat (hanya deskripsi, pool, rate limit, harga, dan status yang bisa diperbarui)

---

### 📑 Langganan

* [x] Tambah dan hapus langganan pelanggan
* [x] Informasi detail langganan: ODP, router, paket, masa aktif, tanggal kontrak, tanggal expired
* [x] Status langganan (aktif/non-aktif)
* [x] Aktivasi manual (tombol power)

  * [x] Pertama kali langganan → otomatis membuat payment (manual input referensi / payment gateway Midtrans)
  * [x] Jika sudah pernah aktif → tanggal aktif paket dipindah ke bulan berikutnya & secret PPPoE pindah ke profile paket
  * [x] Jika belum pernah aktif → kontrak dibuat hari aktivasi & expired bulan depan sesuai tanggal hari ini
* [x] Non-aktivasi → secret PPPoE pindah ke profile isolir & expiredAt = hari ini
* [x] Pencarian & refresh daftar langganan

---

### 💰 Payment & Billing Management

* [ ] Manajemen pembayaran/tagihan pelanggan
* [x] Pembuatan tagihan otomatis saat aktivasi pertama kali
* [ ] Membuat tagihan langganan secara manual oleh admin
* [x] Detail tagihan: nominal, metode pembayaran, status pembayaran, tanggal jatuh tempo
* [x] Mendukung payment gateway Midtrans dan input manual dengan nomor referensi
* [ ] Riwayat pembayaran tersimpan lengkap untuk audit
* [ ] Manual Pricing (biaya tambahan/potongan harga per tagihan)

---

### 📉 Cashflow Management

* [ ] Pencatatan manual pemasukan dan pengeluaran perusahaan
* [ ] Kategori transaksi (operasional, gaji, perangkat, pembayaran pelanggan, dll)
* [ ] Ringkasan arus kas harian, mingguan, bulanan
* [ ] Grafik interaktif cash-in / cash-out
* [ ] Monitoring profitabilitas ISP

---

### 📃 Page Cek Tagihan

* [x] Halaman khusus untuk melihat tagihan bulan berjalan berdasarkan `subsId`
* [x] Detail nominal, status, jatuh tempo, metode pembayaran
* [x] Integrasi pembayaran online (Midtrans)

---

### ⛔ Page Isolir

* [x] Halaman isolir
