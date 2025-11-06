# WhatsApp Settings Component

Komponen UI untuk mengelola koneksi WhatsApp untuk fitur broadcast dan notifikasi otomatis.

## Fitur

### 1. Generate API Key
- Input Secret Key untuk generate API Key baru
- API Key disimpan di localStorage untuk penggunaan selanjutnya
- Menggunakan endpoint: `POST /api/v1/api-keys`

### 2. WhatsApp Connection Management
- **Request QR Code**: Menginisialisasi sesi dan mendapatkan QR code untuk di-scan
- **Real-time Monitoring**: Menggunakan Server-Sent Events (SSE) untuk monitoring status koneksi
- **Status Display**: Menampilkan status koneksi dengan badge berwarna:
  - 🟢 **Connected**: Terhubung
  - 🔵 **QR**: Menunggu scan QR code
  - ⚪ **Disconnected**: Terputus
  - 🔴 **Error**: Terjadi error
  - ⚫ **Logged Out**: Sudah logout

### 3. Session Management
- **Refresh Status**: Cek status koneksi saat ini
- **Logout**: Mengakhiri sesi WhatsApp dan membersihkan kredensial

## Cara Penggunaan

### 1. Setup Base URL (Optional)
Masukkan URL server WhatsApp API. Default: `http://localhost:3000`

### 2. Generate API Key
1. Masukkan Secret Key
2. Klik tombol "Generate"
3. API Key akan tersimpan otomatis

### 3. Connect WhatsApp
1. Masukkan Display Name (optional)
2. Klik "Request QR Code"
3. Scan QR code yang muncul dengan WhatsApp di HP
4. Tunggu hingga status berubah menjadi "Connected"

### 4. Monitoring
- Status koneksi akan ter-update secara real-time melalui SSE
- QR code baru akan muncul otomatis jika diperlukan
- Notifikasi akan muncul saat berhasil terhubung

## Teknologi

- **QR Code Generation**: Menggunakan library `qrcode`
- **Real-time Updates**: Server-Sent Events (SSE)
- **State Management**: React hooks (useState, useEffect, useCallback, useRef)
- **Storage**: localStorage untuk menyimpan API Key dan Base URL

## API Endpoints yang Digunakan

1. `POST /api/v1/api-keys` - Generate API Key
2. `POST /api/v1/whatsapp/sessions/{apiKey}/qr` - Request QR Code
3. `GET /api/v1/whatsapp/sessions/{apiKey}/status` - Check Status
4. `GET /api/v1/whatsapp/sessions/{apiKey}/stream` - SSE Streaming
5. `POST /api/v1/whatsapp/sessions/{apiKey}/logout` - Logout Session

## Komponen Terkait

- `components/app/messages/WhatsAppSettings.tsx` - Main component
- `components/ui/badge.tsx` - Badge component untuk status indicator
- Terintegrasi di `app/(admin)/messages/page.tsx`
