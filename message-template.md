=== REGISTER_SUCCESS ===
Judul: Pendaftaran Berhasil
Konten:
Halo {{nama}}, pendaftaran langganan Anda berhasil ✅

Detail paket:
- Nomor Langganan: {{noLangganan}}
- Paket: {{paket}}
- Harga: Rp{{amount}}

Silakan lakukan pembayaran melalui link berikut:
{{paymentLink}}

Terima kasih 🙏


=== PAYMENT_SUCCESS ===
Judul: Pembayaran Berhasil
Konten:
Halo {{nama}}, pembayaran langganan Anda telah *berhasil* ✅

Detail pembayaran:
- Nomor Langganan: {{noLangganan}}
- Paket: {{paket}}
- Jumlah Bayar: Rp{{amount}}
- Tanggal Bayar: {{tanggalBayar}}
- Masa aktif: {{periode}}

Terima kasih telah melakukan pembayaran tepat waktu 🙏
Selamat menikmati layanan kami!


=== DEACTIVATE_SUBSCRIPTION ===
Judul: Layanan Dinonaktifkan
Konten:
Halo {{nama}},

Layanan internet Anda dengan paket *{{paket}}* telah *dinonaktifkan* karena tagihan bulan ini belum dibayarkan.

Detail Akun:
- Nomor Langganan: {{noLangganan}}

Silakan segera melakukan pembayaran agar layanan dapat diaktifkan kembali.
Jika Anda sudah melakukan pembayaran atau membutuhkan bantuan, silakan hubungi admin/teknisi.


=== ACTIVATE_SUBSCRIPTION ===
Judul: Layanan Diaktifkan
Konten:
Halo {{nama}},

Layanan internet Anda dengan paket *{{paket}}* telah *diaktifkan kembali* ✅

Detail Akun:
- Nomor Langganan: {{noLangganan}}
- Masa aktif hingga: {{periode}}

Terima kasih telah melakukan pembayaran 🙏
Selamat menikmati kembali layanan kami!


=== INVOICE_CREATED ===
Judul: Invoice Baru Dibuat
Konten:
Halo {{nama}},

Invoice baru untuk paket *{{paket}}* sudah dibuat.

Detail pembayaran:
- Nomor Langganan: {{noLangganan}}
- Total: Rp{{amount}}
- Periode tagihan: {{periode}}

Bayar di sini: {{paymentLink}}

⚠️ Link pembayaran hanya berlaku 24 jam.
Jika link sudah kadaluwarsa, silakan hubungi admin/teknisi untuk konfirmasi pembayaran.

=== ACTIVATE_SUBSCRIPTION ===
Judul: Layanan Diaktifkan (PPPOE)
Konten:
Layanan internet Aktif.

Detail Akun:
- Nomor Langganan: {{noLangganan}}
- Nama Pelanggan: {{nama}}
- User PPPOE: {{userPPP}}
- Password PPPOE  {{passwordPPP}}

Abaikan ini jika sudah ada.