# ERP Procurement Admin UI

## Deskripsi

Ini adalah antarmuka pengguna (UI) Admin yang komprehensif untuk sistem Pengadaan (Procurement) ERP, dibangun dengan tumpukan teknologi modern termasuk React, TypeScript, Vite, dan Tailwind CSS. Aplikasi ini mencakup seluruh siklus hidup pengadaan dari ujung ke ujung, mulai dari Permintaan Pembelian (Purchase Requisition) hingga Pembayaran.

## Fitur Utama

-   **Dashboard**: Halaman utama dengan ringkasan dan navigasi.
-   **Purchase Requisition (PR)**: Membuat, mengubah, dan mengajukan permintaan pembelian internal.
-   **Request for Quotation (RFQ)**: Membuat RFQ dari PR yang disetujui, mengundang vendor, dan melakukan tabulasi penawaran.
-   **Bid Tabulation**: Membandingkan penawaran vendor secara berdampingan dengan sistem skor yang dapat disesuaikan.
-   **Purchase Order (PO)**: Membuat PO dari RFQ yang telah dianugerahi pemenang atau secara manual.
-   **Goods Receipt Note (GRN)**: Mencatat penerimaan barang berdasarkan PO.
-   **Service Entry Sheet (SES)**: Mencatat progres penyelesaian layanan/jasa.
-   **3-Way Match Viewer**: Komponen visual untuk membandingkan data antara PO, GRN/SES, dan Faktur, dengan penyorotan perbedaan dan pemeriksaan toleransi.
-   **Faktur (Invoice)**: Membuat faktur dari GRN/SES, dengan pemeriksaan duplikat dan perhitungan pajak otomatis.
-   **Pembayaran (Payment)**: Membuat proposal pembayaran dengan memilih faktur yang jatuh tempo, dan mengeksekusi pembayaran.
-   **Pelaporan**:
    -   Analisis Pengeluaran (Spend Analysis)
    -   Laporan Umur Utang (AP Aging)
    -   Laporan Open PO
    -   Laporan Kinerja Vendor
-   **Otentikasi & Otorisasi**: Sistem login berbasis peran dengan perlindungan UI berdasarkan izin (permissions).
-   **Mock API Server**: Backend disimulasikan sepenuhnya menggunakan Mock Service Worker (MSW) untuk pengembangan dan pengujian yang independen.

## Tumpukan Teknologi (Tech Stack)

-   **Framework**: React 18 + Vite
-   **Bahasa**: TypeScript
-   **Styling**: Tailwind CSS dengan shadcn/ui untuk komponen UI
-   **Ikon**: `lucide-react`
-   **Manajemen State & Data Fetching**: TanStack React Query
-   **Formulir**: React Hook Form dengan Zod untuk validasi skema
-   **Routing**: React Router DOM
-   **Tabel Data**: TanStack React Table
-   **Mock API**: Mock Service Worker (MSW)
-   **Pengujian**: Vitest & React Testing Library
-   **Linting & Formatting**: ESLint & Prettier

## Struktur Folder

```
src/
├── api/                # Semua yang berhubungan dengan API: client, hooks, types, mocks
│   ├── client.ts       # Konfigurasi instance Axios
│   ├── hooks/          # Custom hooks React Query per modul (usePR, usePO, etc.)
│   ├── mocks/          # Konfigurasi MSW (handlers, db, browser/server)
│   └── types/          # Definisi tipe TypeScript untuk data API
├── app/                # Konfigurasi inti aplikasi
│   ├── guards/         # Komponen Guard untuk otorisasi
│   ├── providers/      # Provider konteks (Auth, Query)
│   └── routes.tsx      # Definisi rute aplikasi
├── components/         # Komponen UI yang dapat digunakan kembali
│   ├── DataTable/      # Komponen tabel data generik
│   ├── forms/          # Komponen input form khusus (ItemPicker, CurrencyInput, etc.)
│   ├── layout/         # Komponen tata letak utama (AppShell, Sidebar, Topbar)
│   ├── ui/             # Komponen UI dasar dari shadcn/ui
│   └── MatchViewer/    # Komponen perbandingan 3-way match
├── lib/                # Utilitas, konstanta, dan logika bisnis inti
│   ├── constants.ts    # Konstanta seperti item navigasi
│   ├── format.ts       # Fungsi format (mata uang, tanggal)
│   ├── permissions.ts  # Definisi peran dan izin
│   └── utils.ts        # Utilitas umum (cn)
├── pages/              # Komponen halaman per modul
│   ├── pr/
│   ├── rfq/
│   ├── po/
│   └── ...
├── styles/             # File CSS global
├── App.tsx             # Komponen root aplikasi
└── main.tsx            # Titik masuk aplikasi
```

## Setup dan Menjalankan Secara Lokal

1.  **Clone repositori:**
    ```bash
    git clone <URL_REPOSITORI>
    cd <NAMA_FOLDER>
    ```

2.  **Install dependensi:**
    ```bash
    npm install
    ```

3.  **Buat file environment:**
    Salin isi dari `.env.example` ke file baru bernama `.env`.
    ```bash
    cp .env.example .env
    ```
    Anda dapat menyesuaikan `VITE_API_URL` jika diperlukan, tetapi untuk pengembangan dengan MSW, biarkan default.

4.  **Jalankan server pengembangan:**
    ```bash
    npm run dev
    ```
    Aplikasi sekarang akan berjalan di `http://localhost:5173`.

## Skrip NPM yang Tersedia

-   `npm run dev`: Menjalankan aplikasi dalam mode pengembangan dengan hot-reloading.
-   `npm run build`: Mem-bundle aplikasi untuk produksi di folder `dist/`.
-   `npm run preview`: Menjalankan server lokal untuk melihat hasil build produksi.
-   `npm run lint`: Menjalankan ESLint untuk memeriksa masalah kode.
-   `npm run format`: Memformat semua file kode menggunakan Prettier.
-   `npm test`: Menjalankan pengujian unit dan komponen menggunakan Vitest.

## Pengujian (Testing)

Proyek ini menggunakan Vitest dan React Testing Library. Untuk menjalankan semua suite pengujian:

```bash
npm test
```

## Deployment

Aplikasi ini adalah aplikasi sisi klien murni dan dapat di-deploy di platform hosting statis seperti:

-   Vercel
-   Netlify
-   GitHub Pages

**Langkah Umum:**

1.  Hubungkan repositori Git Anda ke platform pilihan Anda.
2.  Konfigurasikan pengaturan build:
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
3.  Siapkan variabel environment di dasbor platform Anda (jangan commit file `.env` ke Git).
    -   `VITE_API_URL`: Arahkan ke URL backend API produksi Anda.
    -   `VITE_ENABLE_MSW`: Set ke `false` atau hapus variabel ini di produksi.

## Catatan Keamanan

-   **Jangan pernah commit file `.env`** atau rahasia lainnya (seperti kunci API) ke repositori Git. Gunakan variabel environment yang disediakan oleh platform hosting Anda.
-   Otentikasi di-mock di sisi klien. Dalam aplikasi nyata, token JWT akan diterima dari endpoint login API dan disimpan dengan aman (misalnya, di cookie `httpOnly` atau state aplikasi) dan dikirim dalam header `Authorization` pada setiap permintaan.
